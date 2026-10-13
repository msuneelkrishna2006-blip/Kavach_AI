import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../db/supabase.js';

const router = Router();

// GET /api/playbook
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scam_categories')
      .select('*')
      .order('code');

    if (error) throw error;

    // Add helplines
    const helplines = [
      { name: 'National Cybercrime Helpline', number: '1930', description: 'Report cyber fraud 24/7' },
      { name: 'Cybercrime Portal', url: 'https://cybercrime.gov.in', description: 'File online complaints' },
      { name: 'RBI Complaint', number: '14440', description: 'Banking fraud complaints' },
      { name: 'TRAI DND', number: '1909', description: 'Register for Do Not Disturb' },
    ];

    res.json({ data: { categories: data || [], helplines } });
  } catch (err) {
    next(err);
  }
});

export default router;
