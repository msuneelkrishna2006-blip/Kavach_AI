import { contentFingerprint } from '../utils/hash.js';

/**
 * Generate a content fingerprint for the threat radar.
 * Uses normalized text hash.
 */
export function generateFingerprint(normalizedText) {
  return contentFingerprint(normalizedText);
}
