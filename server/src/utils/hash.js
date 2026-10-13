import crypto from 'crypto';
import env from '../config/env.js';

/**
 * Create a salted SHA-256 hash. Used for IP hashing and reporter hashing.
 * Not reversible without the salt.
 */
export function saltedHash(value) {
  return crypto
    .createHmac('sha256', env.HASH_SALT)
    .update(String(value))
    .digest('hex');
}

/**
 * Create a reporter hash from user ID using HMAC-SHA256 with server secret.
 */
export function reporterHash(userId) {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(String(userId))
    .digest('hex');
}

/**
 * Create a content fingerprint (SHA-256 of normalized text).
 */
export function contentFingerprint(text) {
  return crypto
    .createHash('sha256')
    .update(String(text).toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex')
    .substring(0, 32);
}
