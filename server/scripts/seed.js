/**
 * Seed script: Creates demo users with bcrypt-hashed passwords.
 * Run: npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const demoUsers = [
  { email: 'demo.user@example.com', fullName: 'Demo User', role: 'user', password: 'DemoUser2024!' },
  { email: 'demo.analyst@example.com', fullName: 'Demo Analyst', role: 'analyst', password: 'DemoAnalyst2024!' },
  { email: 'demo.admin@example.com', fullName: 'Demo Admin', role: 'admin', password: 'DemoAdmin2024!' },
];

async function seed() {
  console.log('🌱 Seeding demo users...\n');

  for (const user of demoUsers) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭️  ${user.email} already exists, skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

    const { error } = await supabase.from('users').insert({
      email: user.email,
      password_hash: passwordHash,
      full_name: user.fullName,
      role: user.role,
    });

    if (error) {
      console.error(`  ❌ Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`  ✅ Created ${user.email} (${user.role})`);
      console.log(`     Password: ${user.password}`);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n⚠️  These are demo-only credentials. Change them in production.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
