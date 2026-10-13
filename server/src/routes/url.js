import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { urlInspectSchema } from '../schemas/index.js';
import { inspectUrl } from '../engine/urlHeuristics.js';

const router = Router();

// POST /api/url/inspect - offline URL heuristics only (NEVER fetches)
router.post('/inspect', authenticate, validate(urlInspectSchema), async (req, res, next) => {
  try {
    const { url } = req.body;
    const result = inspectUrl(url);

    res.json({
      data: {
        ...result,
        disclaimer: 'This analysis is based on URL structure only. KavachAI never visits or fetches URLs. This is not a guarantee of safety or danger.',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
