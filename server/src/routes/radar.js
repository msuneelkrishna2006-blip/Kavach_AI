import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { radarQuerySchema } from '../schemas/index.js';
import { getRadarSummary, getCampaigns } from '../services/radarService.js';

const router = Router();

// GET /api/radar/summary
router.get('/summary', authenticate, validate(radarQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { range } = req.query;
    const summary = await getRadarSummary(range);
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/radar/campaigns
router.get('/campaigns', authenticate, async (req, res, next) => {
  try {
    const campaigns = await getCampaigns();
    res.json({ data: campaigns });
  } catch (err) {
    next(err);
  }
});

export default router;
