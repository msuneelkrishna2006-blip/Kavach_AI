import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import supabase from '../db/supabase.js';
import logger from '../utils/logger.js';

/**
 * JWT authentication middleware.
 * Verifies token and loads user from DB (checks existence and role freshness).
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Re-check user in DB for role and existence
    supabase
      .from('users')
      .select('id, email, role, full_name, preferred_language, store_history, contribute_to_radar')
      .eq('id', decoded.sub)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found or session expired' } });
        }
        req.user = data;
        next();
      })
      .catch(err => {
        logger.error({ err }, 'Auth middleware DB error');
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication check failed' } });
      });
  } catch (err) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}

/**
 * Role guard middleware. Must be used after authenticate.
 * @param  {...string} roles - Allowed roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}
