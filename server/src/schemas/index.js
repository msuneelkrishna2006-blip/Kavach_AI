import { z } from 'zod';

// Common password list (top entries)
const COMMON_PASSWORDS = [
  'password123', '123456789', '12345678', '1234567890', 'qwerty123',
  'password1', 'iloveyou1', 'abc123456', 'admin12345', 'letmein123',
  'welcome123', 'monkey1234', 'dragon1234', 'master1234', 'password12',
];

const passwordSchema = z.string()
  .min(10, 'Password must be at least 10 characters')
  .max(72, 'Password must not exceed 72 characters')
  .refine(val => /[a-zA-Z]/.test(val), 'Password must include at least one letter')
  .refine(val => /[0-9]/.test(val), 'Password must include at least one number')
  .refine(val => !COMMON_PASSWORDS.includes(val.toLowerCase()), 'This password is too common');

export const registerSchema = z.object({
  email: z.string().email('Invalid email').max(254).transform(v => v.toLowerCase().trim()),
  password: passwordSchema,
  fullName: z.string().min(1, 'Name is required').max(100).transform(v => v.trim()),
}).strict();

export const loginSchema = z.object({
  email: z.string().email('Invalid email').transform(v => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password required for account deletion'),
}).strict();

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).transform(v => v.trim()).optional(),
  preferredLanguage: z.enum(['en', 'te', 'hi']).optional(),
  storeHistory: z.boolean().optional(),
  contributeToRadar: z.boolean().optional(),
}).strict();

export const analyzeSchema = z.object({
  mode: z.enum(['scam_check', 'ai_prompt_check', 'url_inspect']),
  inputType: z.enum(['sms', 'whatsapp', 'email', 'call_transcript', 'url', 'other']),
  text: z.string().min(20, 'Text must be at least 20 characters').max(6000, 'Text must not exceed 6000 characters').transform(v => v.trim()),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  useAI: z.boolean().default(true),
  saveToHistory: z.boolean().default(true),
  saveSanitizedText: z.boolean().default(true),
  contributeToRadar: z.boolean().default(true),
}).strict();

export const demoAnalyzeSchema = z.object({
  text: z.string().min(20, 'Text must be at least 20 characters').max(1500, 'Demo text must not exceed 1500 characters').transform(v => v.trim()),
  inputType: z.enum(['sms', 'whatsapp', 'email', 'call_transcript', 'url', 'other']).default('sms'),
}).strict();

export const redactSchema = z.object({
  text: z.string().min(1).max(6000).transform(v => v.trim()),
}).strict();

export const urlInspectSchema = z.object({
  url: z.string().max(2048).refine(val => {
    try {
      const u = new URL(val);
      return ['http:', 'https:'].includes(u.protocol);
    } catch { return false; }
  }, 'Must be a valid HTTP/HTTPS URL'),
}).strict();

export const feedbackSchema = z.object({
  userLabel: z.enum(['scam', 'legit', 'unsure']),
  helpful: z.boolean().optional(),
  comment: z.string().max(500).optional().nullable(),
}).strict();

export const drillAnswerSchema = z.object({
  answeredScam: z.boolean(),
}).strict();

export const scanListQuerySchema = z.object({
  page: z.string().optional().transform(v => Math.max(1, parseInt(v || '1'))),
  limit: z.string().optional().transform(v => Math.min(50, Math.max(1, parseInt(v || '20')))),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  mode: z.enum(['scam_check', 'ai_prompt_check', 'url_inspect']).optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const radarQuerySchema = z.object({
  range: z.enum(['7d', '30d']).default('7d'),
});

export const adminRoleSchema = z.object({
  role: z.enum(['user', 'analyst', 'admin']),
}).strict();

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
