import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { redactSchema } from '../schemas/index.js';
import { normalize } from '../engine/normalize.js';
import { detectAndRedact } from '../engine/pii.js';
import { extractAndPseudonymize } from '../engine/ioc.js';

const router = Router();

// POST /api/privacy/redact - redaction preview only, no AI, no persistence
router.post('/redact', authenticate, validate(redactSchema), async (req, res, next) => {
  try {
    const { text } = req.body;

    const normResult = normalize(text);
    const piiResult = detectAndRedact(normResult.text);
    const iocResult = extractAndPseudonymize(piiResult.redactedText);

    res.json({
      data: {
        originalLength: text.length,
        sanitizedText: iocResult.pseudonymizedText,
        piiSummary: piiResult.piiSummary,
        piiFindings: piiResult.findings.map(f => ({ type: f.type, maskedHint: f.maskedHint })),
        iocSummary: iocResult.iocSummary,
        iocs: iocResult.iocs.map(i => ({ placeholder: i.placeholder, type: i.type, features: i.features })),
        obfuscationDetected: normResult.obfuscationDetected,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
