import { useState, useEffect } from 'react';
import { radarApi } from '../api/index.js';
import { Radar as RadarIcon, TrendingUp, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function RadarPage() {
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      radarApi.getSummary(range).then(r => setSummary(r.data.data)),
      radarApi.getCampaigns().then(r => setCampaigns(r.data.data)),
    ]).catch(() => toast.error('Failed to load radar'))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-kavach-surface-2 rounded" />
      <div className="h-64 bg-kavach-surface rounded-xl" />
    </div>;
  }

  const hasData = summary && summary.totalSignals > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><RadarIcon className="w-6 h-6" /> Community Threat Radar</h1>
        <div className="flex gap-2">
          {['7d', '30d'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r ? 'bg-kavach-emerald/10 text-kavach-emerald border border-kavach-emerald/20' : 'bg-kavach-surface border border-kavach-border text-kavach-text-muted'
              }`}>{r === '7d' ? '7 Days' : '30 Days'}</button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RadarIcon className="w-16 h-16 text-kavach-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-kavach-text mb-2">No Threat Signals Yet</h3>
          <p className="text-kavach-text-muted max-w-md">
            The Community Threat Radar shows anonymized, aggregated threat patterns from opt-in users.
            Signals appear here as users analyze messages with "Contribute to Radar" enabled.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border text-center">
              <p className="text-3xl font-bold text-white">{summary.totalSignals}</p>
              <p className="text-sm text-kavach-text-muted">Total Signals</p>
            </div>
            <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border text-center">
              <p className="text-3xl font-bold text-white">{summary.categories.length}</p>
              <p className="text-sm text-kavach-text-muted">Categories Active</p>
            </div>
            <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border text-center">
              <p className="text-3xl font-bold text-white">{campaigns.length}</p>
              <p className="text-sm text-kavach-text-muted">Campaigns (≥3 reporters)</p>
            </div>
          </div>

          {/* Category Chart */}
          <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
            <h2 className="text-lg font-semibold text-white mb-4">Threats by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.categories}>
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution */}
          <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
            <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={summary.riskDistribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={80} label={({ level, count }) => `${level}: ${count}`}>
                    {summary.riskDistribution.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][i] || COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaigns */}
          {campaigns.length > 0 && (
            <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
              <h2 className="text-lg font-semibold text-white mb-4">Active Campaigns (≥3 reporters)</h2>
              <div className="space-y-3">
                {campaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-kavach-bg">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        c.risk_level === 'critical' ? 'risk-badge-critical' : c.risk_level === 'high' ? 'risk-badge-high' : 'risk-badge-medium'
                      }`}>{c.risk_level?.toUpperCase()}</span>
                      <span className="ml-2 text-sm text-kavach-text">{c.scam_category || 'unknown'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-kavach-text">{c.distinct_reporters} reporters</p>
                      <p className="text-xs text-kavach-text-muted">{c.occurrences} occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-kavach-text-muted text-center italic">
        Data shown is anonymized and aggregated. Only hash-based fingerprints are stored. No message text is ever shared.
      </p>
    </div>
  );
}
