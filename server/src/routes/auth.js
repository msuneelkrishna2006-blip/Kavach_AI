import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import supabase from '../db/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../schemas/index.js';
import { saltedHash } from '../utils/hash.js';
import logger from '../utils/logger.js';

const router = Router();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function generateToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function sanitizeUser(user) {
  const { password_hash, failed_login_count, locked_until, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    // Check existing user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'An account with this email already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'Registration DB error');
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'auth.register',
      resource_type: 'user',
      resource_id: user.id,
      ip_hash: saltedHash(req.ip),
    });

    const token = generateToken(user);
    res.status(201).json({ data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const genericError = { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user || error) {
      return res.status(401).json(genericError);
    }

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMs = new Date(user.locked_until) - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        error: { code: 'ACCOUNT_LOCKED', message: `Account locked. Try again in ${remainingMin} minutes.` },
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const newCount = user.failed_login_count + 1;
      const updates = { failed_login_count: newCount };
      if (newCount >= LOCKOUT_THRESHOLD) {
        updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      }
      await supabase.from('users').update(updates).eq('id', user.id);
      return res.status(401).json(genericError);
    }

    // Reset lockout counters on success
    await supabase.from('users').update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    }).eq('id', user.id);

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'auth.login',
      resource_type: 'user',
      resource_id: user.id,
      ip_hash: saltedHash(req.ip),
    });

    const token = generateToken(user);
    res.json({ data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ data: req.user });
});

// PATCH /api/auth/password
router.patch('/password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } });
    }

    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', req.user.id);

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'auth.password_change',
      resource_type: 'user',
      resource_id: req.user.id,
      ip_hash: saltedHash(req.ip),
    });

    res.json({ data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
