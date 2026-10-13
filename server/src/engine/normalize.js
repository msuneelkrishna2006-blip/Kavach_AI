/**
 * Text normalization module.
 * NFKC normalize, strip zero-width/bidi control chars, flag obfuscation.
 */

// Zero-width and bidi control characters
const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD]/g;
const BIDI_CONTROL_CHARS = /[\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g;

export function normalize(text) {
  if (!text || typeof text !== 'string') return { text: '', obfuscationDetected: false, flags: [] };
  
  const flags = [];
  let normalized = text;
  
  // Check for zero-width characters before removing
  const zwMatches = normalized.match(ZERO_WIDTH_CHARS);
  if (zwMatches && zwMatches.length > 0) {
    flags.push({ type: 'zero_width_chars', count: zwMatches.length });
  }
  
  // Check for bidi control characters
  const bidiMatches = normalized.match(BIDI_CONTROL_CHARS);
  if (bidiMatches && bidiMatches.length > 0) {
    flags.push({ type: 'bidi_control_chars', count: bidiMatches.length });
  }
  
  // NFKC normalize
  normalized = normalized.normalize('NFKC');
  
  // Strip zero-width and bidi control characters
  normalized = normalized.replace(ZERO_WIDTH_CHARS, '');
  normalized = normalized.replace(BIDI_CONTROL_CHARS, '');
  
  // Normalize whitespace (but preserve newlines for readability)
  normalized = normalized.replace(/[^\S\n]+/g, ' ');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  normalized = normalized.trim();
  
  return {
    text: normalized,
    obfuscationDetected: flags.length > 0,
    flags,
  };
}
