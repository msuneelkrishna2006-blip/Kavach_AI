import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { drillAnswerSchema } from '../schemas/index.js';
import supabase from '../db/supabase.js';

const router = Router();

// GET /api/drills/next
router.get('/next', authenticate, async (req, res, next) => {
  try {
    // Get IDs of scenarios already answered by this user
    const { data: attempted } = await supabase
      .from('drill_attempts')
      .select('scenario_id')
      .eq('user_id', req.user.id);

    const attemptedIds = (attempted || []).map(a => a.scenario_id);

    let query = supabase
      .from('drill_scenarios')
      .select('id, title, channel, message_text, difficulty');

    if (attemptedIds.length > 0) {
      query = query.not('id', 'in', `(${attemptedIds.join(',')})`);
    }

    const { data: scenarios } = await query;

    if (!scenarios || scenarios.length === 0) {
      return res.json({
        data: null,
        meta: { message: 'You have completed all available scenarios! Check back later for new ones.' },
      });
    }

    // Pick a random one
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    // Don't send is_scam or explanation in the response
    res.json({ data: scenario });
  } catch (err) {
    next(err);
  }
});

// POST /api/drills/:id/answer
router.post('/:id/answer', authenticate, validate(drillAnswerSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answeredScam } = req.body;

    // Get the scenario
    const { data: scenario } = await supabase
      .from('drill_scenarios')
      .select('*')
      .eq('id', id)
      .single();

    if (!scenario) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scenario not found' } });
    }

    const correct = answeredScam === scenario.is_scam;

    // Save attempt
    await supabase.from('drill_attempts').insert({
      user_id: req.user.id,
      scenario_id: id,
      answered_scam: answeredScam,
      correct,
    });

    res.json({
      data: {
        correct,
        isScam: scenario.is_scam,
        scamCategory: scenario.scam_category,
        explanation: scenario.explanation,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/drills/stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { data: attempts } = await supabase
      .from('drill_attempts')
      .select('correct, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (!attempts || attempts.length === 0) {
      return res.json({
        data: { totalAttempts: 0, correctCount: 0, accuracy: 0, streaks: [] },
      });
    }

    const correctCount = attempts.filter(a => a.correct).length;
    const accuracy = Math.round((correctCount / attempts.length) * 100);

    res.json({
      data: {
        totalAttempts: attempts.length,
        correctCount,
        accuracy,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
