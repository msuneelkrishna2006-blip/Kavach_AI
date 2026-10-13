/**
 * Grounding check module.
 * Verifies AI evidence quotes against the sanitized text.
 * Uses case-insensitive normalized substring match with fuzzy similarity >= 0.85.
 */

/**
 * Simple character-level similarity (Dice coefficient).
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  const aN = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const bN = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (aN === bN) return 1;
  if (aN.length < 2 || bN.length < 2) return 0;

  const bigrams = new Map();
  for (let i = 0; i < aN.length - 1; i++) {
    const bigram = aN.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  let intersections = 0;
  for (let i = 0; i < bN.length - 1; i++) {
    const bigram = bN.substring(i, i + 2);
    const count = bigrams.get(bigram) || 0;
    if (count > 0) {
      bigrams.set(bigram, count - 1);
      intersections++;
    }
  }

  return (2.0 * intersections) / (aN.length - 1 + bN.length - 1);
}

/**
 * Check if a quote is grounded in the sanitized text.
 * Uses substring match first, then fuzzy similarity.
 */
function isGrounded(quote, sanitizedText) {
  if (!quote || !sanitizedText) return false;
  
  const normalizedQuote = quote.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedText = sanitizedText.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Exact substring match
  if (normalizedText.includes(normalizedQuote)) return true;
  
  // Sliding window fuzzy match
  const windowSize = normalizedQuote.length;
  if (windowSize < 3) return false;
  
  for (let i = 0; i <= normalizedText.length - Math.floor(windowSize * 0.7); i++) {
    const window = normalizedText.substring(i, i + windowSize + 10);
    if (similarity(normalizedQuote, window) >= 0.85) return true;
  }
  
  return false;
}

/**
 * Verify and annotate AI response red flags with grounding status.
 * Drops ungrounded flags or marks them as grounded=false.
 */
export function verifyGrounding(aiResponse, sanitizedText) {
  if (!aiResponse || !aiResponse.red_flags) return aiResponse;

  const verifiedFlags = aiResponse.red_flags.map(flag => {
    const grounded = isGrounded(flag.evidence_quote, sanitizedText);
    return { ...flag, grounded };
  });

  // Filter: keep only grounded flags
  const groundedFlags = verifiedFlags.filter(f => f.grounded);
  
  return {
    ...aiResponse,
    red_flags: groundedFlags,
    _ungrounded_count: verifiedFlags.length - groundedFlags.length,
  };
}

/**
 * Validate and clamp AI risk adjustment.
 */
export function validateAdjustment(aiResponse) {
  if (!aiResponse) return { adjustment: 0, reason: '' };
  
  let adjustment = Number(aiResponse.risk_adjustment) || 0;
  adjustment = Math.min(15, Math.max(-15, adjustment));
  
  const reason = aiResponse.adjustment_reason || '';
  if (adjustment !== 0 && !reason.trim()) {
    adjustment = 0; // Force to 0 if no reason provided
  }
  
  return { adjustment, reason };
}

export { isGrounded, similarity };
