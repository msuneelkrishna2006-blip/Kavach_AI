import { Router } from 'express';
import env from '../config/env.js';
import { isAIAvailable } from '../ai/gemini.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    data: {
      status: 'ok',
      version: '1.0.0',
      aiAvailable: isAIAvailable(),
      time: new Date().toISOString(),
    },
  });
});

export default router;
