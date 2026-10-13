import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileUpdateSchema, deleteAccountSchema } from '../schemas/index.js';
import { saltedHash } from '../utils/hash.js';

const router = Router();

// PATCH /api/users/me
router.patch('/me', authenticate, validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.fullName !== undefined) updates.full_name = req.body.fullName;
    if (req.body.preferredLanguage !== undefined) updates.preferred_language = req.body.preferredLanguage;
    if (req.body.storeHistory !== undefined) updates.store_history = req.body.storeHistory;
    if (req.body.contributeToRadar !== undefined) updates.contribute_to_radar = req.body.contributeToRadar;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, role, preferred_language, store_history, contribute_to_radar, created_at, updated_at')
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/export
router.get('/me/export', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userResult, scansResult, feedbackResult, drillsResult] = await Promise.all([
      supabase.from('users').select('id, email, full_name, role, preferred_language, store_history, contribute_to_radar, created_at').eq('id', userId).single(),
      supabase.from('scans').select('id, mode, input_type, sanitized_text, text_length, pii_summary, ioc_summary, rule_findings, rule_score, ai_used, ai_analysis, ai_adjustment, final_score, risk_level, scam_category, agreement, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('scan_feedback').select('scan_id, user_label, helpful, comment, created_at').eq('user_id', userId),
      supabase.from('drill_attempts').select('scenario_id, answered_scam, correct, created_at').eq('user_id', userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      disclaimer: 'This export contains your KavachAI data. Sanitized text may contain redaction placeholders.',
      profile: userResult.data,
      scans: scansResult.data || [],
      feedback: feedbackResult.data || [],
      drill_attempts: drillsResult.data || [],
    };

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'account.export',
      resource_type: 'user',
      resource_id: userId,
      ip_hash: saltedHash(req.ip),
    });

    res.json({ data: exportData });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/me
router.delete('/me', authenticate, validate(deleteAccountSchema), async (req, res, next) => {
  try {
    const { password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password' } });
    }

    // Audit log before deletion
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'account.delete',
      resource_type: 'user',
      resource_id: req.user.id,
      ip_hash: saltedHash(req.ip),
    });

    // Delete user (cascades to scans, feedback, drill_attempts, ai_usage)
    const { error } = await supabase.from('users').delete().eq('id', req.user.id);
    if (error) throw error;

    res.json({ data: { message: 'Account and all associated data have been deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
