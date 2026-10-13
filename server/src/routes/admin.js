import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminRoleSchema } from '../schemas/index.js';
import supabase from '../db/supabase.js';
import { generateBriefing, isAIAvailable } from '../ai/gemini.js';
import { saltedHash } from '../utils/hash.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/admin/analytics
router.get('/analytics', authenticate, requireRole('analyst', 'admin'), async (req, res, next) => {
  try {
    const [totalScansRes, riskDistRes, categoryDistRes, aiUsageRes, feedbackRes] = await Promise.all([
      supabase.from('scans').select('id', { count: 'exact', head: true }),
      supabase.from('scans').select('risk_level'),
      supabase.from('scans').select('scam_category'),
      supabase.from('scans').select('ai_used'),
      supabase.from('scan_feedback').select('user_label'),
    ]);

    const riskDist = {};
    (riskDistRes.data || []).forEach(s => {
      riskDist[s.risk_level] = (riskDist[s.risk_level] || 0) + 1;
    });

    const catDist = {};
    (categoryDistRes.data || []).forEach(s => {
      const cat = s.scam_category || 'none';
      catDist[cat] = (catDist[cat] || 0) + 1;
    });

    const aiUsage = { used: 0, notUsed: 0 };
    (aiUsageRes.data || []).forEach(s => {
      if (s.ai_used) aiUsage.used++; else aiUsage.notUsed++;
    });

    const feedbackDist = {};
    (feedbackRes.data || []).forEach(f => {
      feedbackDist[f.user_label] = (feedbackDist[f.user_label] || 0) + 1;
    });

    res.json({
      data: {
        totalScans: totalScansRes.count || 0,
        riskDistribution: riskDist,
        categoryDistribution: catDist,
        aiUsage,
        feedbackDistribution: feedbackDist,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/calibration
router.get('/calibration', authenticate, requireRole('analyst', 'admin'), async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('scan_feedback')
      .select('user_label, scan_id')
      .limit(500);

    if (!data || data.length === 0) {
      return res.json({ data: { pairs: [], summary: 'No feedback data available yet.' } });
    }

    // Get corresponding scans
    const scanIds = data.map(f => f.scan_id);
    const { data: scans } = await supabase
      .from('scans')
      .select('id, risk_level, final_score')
      .in('id', scanIds);

    const scanMap = {};
    (scans || []).forEach(s => { scanMap[s.id] = s; });

    const pairs = data.map(f => ({
      userLabel: f.user_label,
      riskLevel: scanMap[f.scan_id]?.risk_level,
      finalScore: scanMap[f.scan_id]?.final_score,
    })).filter(p => p.riskLevel);

    res.json({ data: { pairs, total: pairs.length } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/briefing
router.post('/briefing', authenticate, requireRole('analyst', 'admin'), async (req, res, next) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({ error: { code: 'AI_UNAVAILABLE', message: 'AI is not configured' } });
    }

    // Gather aggregates only
    const [riskRes, catRes, feedbackRes] = await Promise.all([
      supabase.from('scans').select('risk_level'),
      supabase.from('scans').select('scam_category'),
      supabase.from('scan_feedback').select('user_label'),
    ]);

    const riskDist = {};
    (riskRes.data || []).forEach(s => { riskDist[s.risk_level] = (riskDist[s.risk_level] || 0) + 1; });

    const catDist = {};
    (catRes.data || []).forEach(s => {
      const cat = s.scam_category || 'none';
      catDist[cat] = (catDist[cat] || 0) + 1;
    });

    const feedbackDist = {};
    (feedbackRes.data || []).forEach(f => { feedbackDist[f.user_label] = (feedbackDist[f.user_label] || 0) + 1; });

    const aggregates = {
      total_scans: (riskRes.data || []).length,
      risk_distribution: riskDist,
      category_distribution: catDist,
      feedback_distribution: feedbackDist,
      period: 'all time',
    };

    const briefing = await generateBriefing(aggregates);
    res.json({ data: briefing });
  } catch (err) {
    logger.warn({ error: err.message }, 'Briefing generation failed');
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticate, requireRole('admin'), validate(adminRoleSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Cannot demote the last admin
    if (role !== 'admin') {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length === 1 && admins[0].id === id) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cannot demote the last admin' } });
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, email, role')
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'admin.role_change',
      resource_type: 'user',
      resource_id: id,
      ip_hash: saltedHash(req.ip),
      metadata: { new_role: role },
    });

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit
router.get('/audit', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      data: data || [],
      meta: { total: count || 0, page, limit },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
