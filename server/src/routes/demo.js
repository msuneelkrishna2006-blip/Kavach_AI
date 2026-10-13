import { Router } from 'express';
import { demoLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { demoAnalyzeSchema } from '../schemas/index.js';
import { normalize } from '../engine/normalize.js';
import { detectAndRedact } from '../engine/pii.js';
import { extractAndPseudonymize } from '../engine/ioc.js';
import { evaluateRules } from '../engine/rules.js';
import { calculateScore } from '../engine/scoring.js';

const router = Router();

// POST /api/demo/analyze - public, rules-only, no persistence, no AI
router.post('/analyze', demoLimiter, validate(demoAnalyzeSchema), async (req, res, next) => {
  try {
    const { text, inputType } = req.body;

    const normResult = normalize(text);
    const piiResult = detectAndRedact(normResult.text);
    const iocResult = extractAndPseudonymize(piiResult.redactedText);
    const sanitizedText = iocResult.pseudonymizedText;

    const ruleFindings = evaluateRules(sanitizedText, iocResult.iocs, normResult.flags);
    const { score, breakdown, riskLevel } = calculateScore(ruleFindings);

    // Infer category
    const categoryVotes = {};
    for (const f of ruleFindings) {
      if (f.categoryHint && f.categoryHint !== 'none' && !f.isMitigation) {
        categoryVotes[f.categoryHint] = (categoryVotes[f.categoryHint] || 0) + f.weight;
      }
    }
    const scamCategory = Object.keys(categoryVotes).length > 0
      ? Object.entries(categoryVotes).sort((a, b) => b[1] - a[1])[0][0]
      : 'none';

    res.json({
      data: {
        mode: 'demo',
        inputType,
        textLength: text.length,
        piiSummary: piiResult.piiSummary,
        piiFindings: piiResult.findings.map(f => ({ type: f.type, maskedHint: f.maskedHint })),
        iocSummary: iocResult.iocSummary,
        sanitizedText,
        obfuscationDetected: normResult.obfuscationDetected,
        ruleFindings: breakdown,
        ruleScore: score,
        finalScore: score,
        riskLevel,
        scamCategory,
        aiUsed: false,
        agreement: 'not_applicable',
        disclaimer: 'KavachAI provides a heuristic risk assessment, not a guarantee. This is a demo — register for full AI-powered analysis.',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
