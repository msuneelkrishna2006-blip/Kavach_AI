import supabase from '../db/supabase.js';
import { reporterHash } from '../utils/hash.js';

/**
 * Update or create a threat signal from a scan.
 */
export async function updateThreatSignal(fingerprint, scamCategory, riskLevel, userId) {
  const rHash = reporterHash(userId);

  // Check if signal exists
  const { data: existing } = await supabase
    .from('threat_signals')
    .select('fingerprint, occurrences, distinct_reporters')
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  if (existing) {
    // Check if this reporter already contributed
    const { data: existingReport } = await supabase
      .from('threat_signal_reports')
      .select('fingerprint')
      .eq('fingerprint', fingerprint)
      .eq('reporter_hash', rHash)
      .maybeSingle();

    const updates = {
      occurrences: existing.occurrences + 1,
      last_seen_at: new Date().toISOString(),
    };

    if (!existingReport) {
      updates.distinct_reporters = existing.distinct_reporters + 1;
      await supabase.from('threat_signal_reports').insert({
        fingerprint,
        reporter_hash: rHash,
      });
    }

    if (scamCategory && scamCategory !== 'none') updates.scam_category = scamCategory;
    if (riskLevel) updates.risk_level = riskLevel;

    await supabase.from('threat_signals').update(updates).eq('fingerprint', fingerprint);
  } else {
    await supabase.from('threat_signals').insert({
      fingerprint,
      scam_category: scamCategory !== 'none' ? scamCategory : null,
      risk_level: riskLevel,
    });

    await supabase.from('threat_signal_reports').insert({
      fingerprint,
      reporter_hash: rHash,
    });
  }
}

/**
 * Get radar summary (aggregated data only).
 */
export async function getRadarSummary(range = '7d') {
  const days = range === '30d' ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: signals } = await supabase
    .from('threat_signals')
    .select('scam_category, risk_level, occurrences, distinct_reporters, last_seen_at')
    .gte('last_seen_at', since)
    .order('occurrences', { ascending: false });

  if (!signals || signals.length === 0) {
    return { categories: [], riskDistribution: [], totalSignals: 0, totalReporters: 0, period: range };
  }

  // Aggregate by category
  const catMap = {};
  let totalSignals = 0;
  let totalReporters = 0;

  for (const s of signals) {
    const cat = s.scam_category || 'other_suspicious';
    if (!catMap[cat]) catMap[cat] = { category: cat, count: 0, reporters: 0 };
    catMap[cat].count += s.occurrences;
    catMap[cat].reporters += s.distinct_reporters;
    totalSignals += s.occurrences;
    totalReporters += s.distinct_reporters;
  }

  // Risk distribution
  const riskMap = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const s of signals) {
    riskMap[s.risk_level] = (riskMap[s.risk_level] || 0) + s.occurrences;
  }

  return {
    categories: Object.values(catMap).sort((a, b) => b.count - a.count),
    riskDistribution: Object.entries(riskMap).map(([level, count]) => ({ level, count })),
    totalSignals,
    totalReporters,
    period: range,
  };
}

/**
 * Get campaigns (signals with distinct_reporters >= 3).
 */
export async function getCampaigns() {
  const { data } = await supabase
    .from('threat_signals')
    .select('fingerprint, scam_category, risk_level, occurrences, distinct_reporters, first_seen_at, last_seen_at')
    .gte('distinct_reporters', 3)
    .order('distinct_reporters', { ascending: false })
    .limit(20);

  return data || [];
}
