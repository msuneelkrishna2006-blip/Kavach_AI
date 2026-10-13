import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { analyzeSchema, feedbackSchema, scanListQuerySchema, uuidParamSchema } from '../schemas/index.js';
import { normalize } from '../engine/normalize.js';
import { detectAndRedact } from '../engine/pii.js';
import { extractAndPseudonymize } from '../engine/ioc.js';
import { evaluateRules } from '../engine/rules.js';
import { calculateScore, computeFinalScore, computeAgreement } from '../engine/scoring.js';
import { generateFingerprint } from '../engine/fingerprint.js';
import { isAIAvailable, analyzeWithAI, checkAIPromptSafety } from '../ai/gemini.js';
import { checkAndIncrementQuota } from '../services/quotaService.js';
import { updateThreatSignal } from '../services/radarService.js';
import supabase from '../db/supabase.js';
import { saltedHash } from '../utils/hash.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Determine scam category from rule findings.
 */
function inferCategory(findings) {
  const categoryVotes = {};
  for (const f of findings) {
    if (f.categoryHint && f.categoryHint !== 'none' && !f.isMitigation) {
      categoryVotes[f.categoryHint] = (categoryVotes[f.categoryHint] || 0) + f.weight;
    }
  }
  if (Object.keys(categoryVotes).length === 0) return 'none';
  return Object.entries(categoryVotes).sort((a, b) => b[1] - a[1])[0][0];
}

// POST /api/scans/analyze
router.post('/analyze', authenticate, aiLimiter, validate(analyzeSchema), async (req, res, next) => {
  try {
    const { mode, inputType, text, language, useAI, saveToHistory, saveSanitizedText, contributeToRadar } = req.body;

    // Step 1: Normalize
    const normResult = normalize(text);
    const normalizedText = normResult.text;

    // Step 2: PII detection and redaction (server-side, never trusting client)
    const piiResult = detectAndRedact(normalizedText);

    // Step 3: IOC pseudonymization
    const iocResult = extractAndPseudonymize(piiResult.redactedText);
    const sanitizedText = iocResult.pseudonymizedText;

    // Step 4: Rule engine
    const ruleFindings = evaluateRules(sanitizedText, iocResult.iocs, normResult.flags);
    const { score: ruleScore, breakdown, riskLevel: ruleRiskLevel } = calculateScore(ruleFindings);

    // Step 5: Fingerprint
    const fingerprint = generateFingerprint(normalizedText);

    // Step 6: AI analysis (optional)
    let aiAnalysis = null;
    let aiAdjustment = 0;
    let aiUsed = false;
    let agreement = 'not_applicable';

    if (useAI && isAIAvailable() && mode !== 'url_inspect') {
      const quota = await checkAndIncrementQuota(req.user.id);
      if (quota.allowed) {
        try {
          if (mode === 'ai_prompt_check') {
            aiAnalysis = await checkAIPromptSafety({
              sanitizedText,
              iocFeatures: iocResult.iocs.map(i => ({ placeholder: i.placeholder, type: i.type, features: i.features })),
              piiRedactionCounts: piiResult.piiSummary,
            });
            aiUsed = true;
          } else {
            aiAnalysis = await analyzeWithAI({
              language,
              inputType,
              ruleScore,
              ruleFindings: ruleFindings.filter(f => !f.isMitigation).map(f => ({
                id: f.id, label: f.label, weight: f.weight, evidence_snippet: f.evidenceSnippet,
              })),
              iocFeatures: iocResult.iocs.map(i => ({ placeholder: i.placeholder, type: i.type, features: i.features })),
              piiRedactionCounts: piiResult.piiSummary,
              sanitizedText,
            });
            aiUsed = true;
            aiAdjustment = aiAnalysis.risk_adjustment || 0;
            agreement = computeAgreement(ruleRiskLevel, aiAnalysis.verdict);
          }
        } catch (err) {
          logger.warn({ scanId: 'pending', error: err.message }, 'AI analysis failed, falling back to rules-only');
          aiAnalysis = null;
          aiUsed = false;
        }
      }
    }

    // Step 7: Final score
    const { finalScore, riskLevel } = computeFinalScore(ruleScore, aiAdjustment);
    const scamCategory = aiAnalysis?.scam_category || inferCategory(ruleFindings);

    // Step 8: Persist (if opted in)
    let scanId = null;
    if (saveToHistory) {
      const { data: scan, error } = await supabase.from('scans').insert({
        user_id: req.user.id,
        mode,
        input_type: inputType,
        sanitized_text: saveSanitizedText ? sanitizedText : null,
        text_length: text.length,
        fingerprint,
        pii_summary: piiResult.piiSummary,
        ioc_summary: iocResult.iocSummary,
        rule_findings: breakdown,
        rule_score: ruleScore,
        ai_used: aiUsed,
        ai_analysis: aiAnalysis,
        ai_adjustment: aiAdjustment,
        final_score: finalScore,
        risk_level: riskLevel,
        scam_category: scamCategory !== 'none' ? scamCategory : null,
        agreement,
      }).select('id').single();

      if (!error) {
        scanId = scan.id;
        await supabase.from('audit_logs').insert({
          user_id: req.user.id,
          action: 'scan.create',
          resource_type: 'scan',
          resource_id: scanId,
          ip_hash: saltedHash(req.ip),
          metadata: { mode, input_type: inputType, risk_level: riskLevel },
        });
      }
    }

    // Step 9: Threat radar (if opted in)
    if (contributeToRadar && riskLevel !== 'low') {
      try {
        await updateThreatSignal(fingerprint, scamCategory, riskLevel, req.user.id);
      } catch (err) {
        logger.warn({ error: err.message }, 'Threat signal update failed');
      }
    }

    // Response
    res.json({
      data: {
        scanId,
        mode,
        inputType,
        textLength: text.length,
        piiSummary: piiResult.piiSummary,
        piiFindings: piiResult.findings.map(f => ({ type: f.type, maskedHint: f.maskedHint })),
        iocSummary: iocResult.iocSummary,
        iocs: iocResult.iocs.map(i => ({ placeholder: i.placeholder, type: i.type, features: i.features })),
        sanitizedText,
        obfuscationDetected: normResult.obfuscationDetected,
        ruleFindings: breakdown,
        ruleScore,
        aiUsed,
        aiAnalysis,
        aiAdjustment,
        finalScore,
        riskLevel,
        scamCategory,
        agreement,
        fingerprint,
        disclaimer: 'KavachAI provides a heuristic risk assessment, not a guarantee.',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scans
router.get('/', authenticate, validate(scanListQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, riskLevel, category, mode, search, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('scans')
      .select('id, mode, input_type, text_length, rule_score, final_score, risk_level, scam_category, ai_used, agreement, created_at', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (riskLevel) query = query.eq('risk_level', riskLevel);
    if (category) query = query.eq('scam_category', category);
    if (mode) query = query.eq('mode', mode);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      data: data || [],
      meta: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scans/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid scan ID' } });
    }

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id) // IDOR protection
      .maybeSingle();

    if (!data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }
    if (error) throw error;

    // Get feedback if exists
    const { data: feedback } = await supabase
      .from('scan_feedback')
      .select('user_label, helpful, comment, created_at')
      .eq('scan_id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    res.json({ data: { ...data, feedback } });
  } catch (err) {
    next(err);
  }
});

// GET /api/scans/:id/report
router.get('/:id/report', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'json';

    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!data) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }

    // Sanitized report (no raw values)
    const report = {
      report_id: data.id,
      generated_at: new Date().toISOString(),
      mode: data.mode,
      input_type: data.input_type,
      text_length: data.text_length,
      risk_level: data.risk_level,
      final_score: data.final_score,
      rule_score: data.rule_score,
      ai_used: data.ai_used,
      ai_adjustment: data.ai_adjustment,
      agreement: data.agreement,
      scam_category: data.scam_category,
      pii_summary: data.pii_summary,
      ioc_summary: data.ioc_summary,
      rule_findings: data.rule_findings,
      ai_analysis: data.ai_used ? {
        verdict: data.ai_analysis?.verdict,
        summary: data.ai_analysis?.summary,
        red_flags: data.ai_analysis?.red_flags,
        recommended_actions: data.ai_analysis?.recommended_actions,
        family_alert_message: data.ai_analysis?.family_alert_message,
      } : null,
      disclaimer: 'KavachAI provides a heuristic risk assessment, not a guarantee.',
    };

    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.send(JSON.stringify(report, null, 2));
    } else {
      res.json({ data: report });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/scans/:id/feedback
router.post('/:id/feedback', authenticate, validate(feedbackSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify scan belongs to user
    const { data: scan } = await supabase
      .from('scans')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!scan) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }

    const { data, error } = await supabase
      .from('scan_feedback')
      .upsert({
        scan_id: id,
        user_id: req.user.id,
        user_label: req.body.userLabel,
        helpful: req.body.helpful,
        comment: req.body.comment || null,
      }, { onConflict: 'scan_id,user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/scans/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: scan } = await supabase
      .from('scans')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!scan) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }

    await supabase.from('scans').delete().eq('id', id);

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'scan.delete',
      resource_type: 'scan',
      resource_id: id,
      ip_hash: saltedHash(req.ip),
    });

    res.json({ data: { message: 'Scan deleted' } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/scans (clear all)
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase.from('scans').delete().eq('user_id', req.user.id);
    if (error) throw error;

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'scan.clear_all',
      resource_type: 'scan',
      ip_hash: saltedHash(req.ip),
    });

    res.json({ data: { message: 'All scan history cleared' } });
  } catch (err) {
    next(err);
  }
});

export default router;
