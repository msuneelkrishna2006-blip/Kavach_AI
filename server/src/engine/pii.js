/**
 * PII Detection and Redaction Engine
 * Detects and redacts sensitive data: Aadhaar, PAN, cards, OTP, PIN, passwords,
 * bank accounts, IFSC, API keys, bearer tokens, private keys.
 */

import { verhoeffValidate } from '../utils/verhoeff.js';
import { luhnValidate } from '../utils/luhn.js';

// Pattern definitions
const patterns = {
  // Aadhaar: 12 digits (optional spaces/hyphens), first digit 2-9
  aadhaar: {
    regex: /\b([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})\b/g,
    type: 'AADHAAR',
    placeholder: '[AADHAAR_REDACTED]',
    validate: (match) => {
      const digits = match.replace(/[\s-]/g, '');
      return digits.length === 12 && verhoeffValidate(digits);
    },
  },
  // PAN: 5 letters, 4 digits, 1 letter
  pan: {
    regex: /\b([A-Z]{5}[0-9]{4}[A-Z])\b/g,
    type: 'PAN',
    placeholder: '[PAN_REDACTED]',
    validate: () => true,
  },
  // Card numbers: 13-19 digits with optional spaces/hyphens, Luhn validated
  card: {
    regex: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7})\b/g,
    type: 'CARD',
    placeholder: '[CARD_REDACTED]',
    validate: (match) => {
      const digits = match.replace(/[\s-]/g, '');
      return digits.length >= 13 && digits.length <= 19 && luhnValidate(digits);
    },
  },
  // OTP when labeled
  otp: {
    regex: /\b(?:OTP|otp|one[- ]?time[- ]?password|verification[- ]?code)\s*(?:is|:|-|=)\s*(\d{4,8})\b/gi,
    type: 'OTP',
    placeholder: '[OTP_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // PIN when labeled  
  pin: {
    regex: /\b(?:UPI[- ]?PIN|ATM[- ]?PIN|pin|MPIN)\s*(?:is|:|-|=)\s*(\d{4,6})\b/gi,
    type: 'PIN',
    placeholder: '[PIN_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // CVV when labeled
  cvv: {
    regex: /\b(?:CVV|CVC|CVV2|security[- ]?code)\s*(?:is|:|-|=)\s*(\d{3,4})\b/gi,
    type: 'CVV',
    placeholder: '[CVV_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // Password when labeled
  password: {
    regex: /\b(?:password|passwd|passcode)\s*(?:is|:|-|=)\s*(\S{3,30})\b/gi,
    type: 'PASSWORD',
    placeholder: '[PASSWORD_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // Bank account numbers (9-18 digits near account/a\/c)
  bankAccount: {
    regex: /\b(?:account|a\/c|acct)[- ]?(?:no|number|num|#)?[.:\s-]*(\d{9,18})\b/gi,
    type: 'BANK_ACCT',
    placeholder: '[BANK_ACCT_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // IFSC codes
  ifsc: {
    regex: /\b(?:IFSC)[- ]?(?:code)?[:\s-]*([A-Z]{4}0[A-Z0-9]{6})\b/gi,
    type: 'IFSC',
    placeholder: '[IFSC_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // IFSC standalone pattern
  ifscStandalone: {
    regex: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g,
    type: 'IFSC',
    placeholder: '[IFSC_REDACTED]',
    validate: (match) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(match),
  },
  // API keys and bearer tokens
  apiKey: {
    regex: /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer)\s*[=:]\s*['"]*([A-Za-z0-9_\-./+=]{20,})['"]*\b/gi,
    type: 'SECRET',
    placeholder: '[SECRET_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // Bearer token in headers
  bearerToken: {
    regex: /Bearer\s+([A-Za-z0-9_\-./+=]{20,})/g,
    type: 'SECRET',
    placeholder: '[SECRET_REDACTED]',
    validate: () => true,
    captureGroup: 0,
  },
  // Private key markers
  privateKey: {
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    type: 'SECRET',
    placeholder: '[SECRET_REDACTED]',
    validate: () => true,
  },
};

/**
 * Detect and redact PII from text.
 * Returns { redactedText, findings: [{ type, count, maskedHint }], piiSummary }
 */
export function detectAndRedact(text) {
  if (!text || typeof text !== 'string') {
    return { redactedText: '', findings: [], piiSummary: {} };
  }

  let redactedText = text;
  const findings = [];
  const counts = {};

  // Process patterns in order of specificity (most specific first to avoid double-matches)
  const orderedPatterns = [
    'privateKey', 'bearerToken', 'apiKey',
    'aadhaar', 'pan', 'card',
    'otp', 'pin', 'cvv', 'password',
    'bankAccount', 'ifsc',
  ];

  for (const key of orderedPatterns) {
    const pattern = patterns[key];
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;

    while ((match = regex.exec(redactedText)) !== null) {
      const fullMatch = match[0];
      const valueToValidate = match[1] || fullMatch;

      // Skip if already redacted
      if (fullMatch.includes('[') && fullMatch.includes('REDACTED]')) continue;

      if (pattern.validate(valueToValidate)) {
        if (!counts[pattern.type]) counts[pattern.type] = 0;
        counts[pattern.type]++;

        // Create masked hint (show first 2 and last 2 chars for long values)
        const cleanValue = valueToValidate.replace(/[\s-]/g, '');
        let maskedHint = '';
        if (cleanValue.length > 4 && pattern.type !== 'SECRET' && pattern.type !== 'PASSWORD') {
          maskedHint = cleanValue.substring(0, 2) + '****' + cleanValue.substring(cleanValue.length - 2);
        } else {
          maskedHint = '****';
        }

        findings.push({
          type: pattern.type,
          maskedHint,
          position: match.index,
        });

        // Replace in text
        redactedText = redactedText.substring(0, match.index) +
          pattern.placeholder +
          redactedText.substring(match.index + fullMatch.length);

        // Reset regex since we modified the string
        regex.lastIndex = match.index + pattern.placeholder.length;
      }
    }
  }

  // Build summary
  const piiSummary = {};
  for (const [type, count] of Object.entries(counts)) {
    piiSummary[type] = count;
  }

  return { redactedText, findings, piiSummary };
}
