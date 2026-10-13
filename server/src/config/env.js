import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_DAILY_QUOTA_PER_USER: z.string().default('25').transform(Number),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_DB_URL: z.string().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  HASH_SALT: z.string().min(8).default('kavachai_default_salt_change_me'),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error('❌ Environment validation failed:');
  if (err.errors) {
    err.errors.forEach(e => console.error(`  - ${e.path.join('.')}: ${e.message}`));
  }
  process.exit(1);
}

export default env;
