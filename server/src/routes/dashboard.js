import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../db/supabase.js';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [scansResult, highRiskResult, recentResult] = await Promise.all([
      supabase.from('scans').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('scans').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('risk_level', ['high', 'critical']),
      supabase.from('scans').select('id, mode, input_type, final_score, risk_level, scam_category, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    ]);

    // Calculate total PII redactions from scan summaries
    const { data: piiScans } = await supabase
      .from('scans')
      .select('pii_summary')
      .eq('user_id', userId);

    let totalPiiRedactions = 0;
    if (piiScans) {
      for (const scan of piiScans) {
        if (scan.pii_summary) {
          totalPiiRedactions += Object.values(scan.pii_summary).reduce((a, b) => a + b, 0);
        }
      }
    }

    res.json({
      data: {
        totalScans: scansResult.count || 0,
        highRiskScans: highRiskResult.count || 0,
        totalPiiRedactions,
        recentScans: recentResult.data || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
