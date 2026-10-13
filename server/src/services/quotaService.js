import supabase from '../db/supabase.js';
import env from '../config/env.js';

/**
 * Check and increment user's daily AI usage quota.
 * @returns {{ allowed: boolean, remaining: number }}
 */
export async function checkAndIncrementQuota(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: usage } = await supabase
    .from('ai_usage_daily')
    .select('call_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  const currentCount = usage?.call_count || 0;
  const quota = env.AI_DAILY_QUOTA_PER_USER;

  if (currentCount >= quota) {
    return { allowed: false, remaining: 0 };
  }

  // Upsert
  await supabase
    .from('ai_usage_daily')
    .upsert({
      user_id: userId,
      usage_date: today,
      call_count: currentCount + 1,
    }, { onConflict: 'user_id,usage_date' });

  return { allowed: true, remaining: quota - currentCount - 1 };
}
