import { useState, useEffect } from 'react';
import { radarApi } from '../api/index.js';
import { Radio, Shield, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

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

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  const hasData = summary && summary.totalSignals > 0;
  const riskBadge = { low: 'risk-low', medium: 'risk-medium',
                      high: 'risk-high', critical: 'risk-critical' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display-sm text-text">Threat Radar</h1>
        <div className="flex gap-2">
          {['7d', '30d'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium
                border transition-colors
                ${range === r
                  ? 'bg-emerald/8 text-emerald border-emerald/25'
                  : 'bg-surface border-border text-text-muted'}`}>
              {r === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Radio className="w-12 h-12 text-text-dim mb-3 opacity-40" />
          <h3 className="font-['Sora'] font-semibold text-text mb-2">
            No threat signals yet
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            Signals appear here as users analyze messages with
            "Contribute to Radar" enabled. All data is anonymized
            — only hash-based fingerprints are stored.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border text-center">
              <p className="text-2xl font-['Sora'] font-bold text-text">{summary.totalSignals}</p>
              <p className="text-xs text-text-muted">Total signals</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border text-center">
              <p className="text-2xl font-['Sora'] font-bold text-text">{summary.categories.length}</p>
              <p className="text-xs text-text-muted">Categories</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border text-center">
              <p className="text-2xl font-['Sora'] font-bold text-text">{campaigns.length}</p>
              <p className="text-xs text-text-muted">Campaigns</p>
            </div>
          </div>

          <div className="rounded-xl bg-surface border border-border p-5">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">By category</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.categories}>
                <XAxis dataKey="category" tick={{ fill: '#8896b3', fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fill: '#8896b3', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#151d30', border: '1px solid #243049', borderRadius: '8px', color: '#e8ecf4' }} />
                <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {campaigns.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-5">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Active campaigns</h2>
              <div className="space-y-2">
                {campaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-midnight">
                    <div className="flex items-center gap-2">
                      <span className={`risk-badge ${riskBadge[c.risk_level] || 'risk-medium'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {c.risk_level?.toUpperCase()}
                      </span>
                      <span className="text-sm text-text">{c.scam_category || 'unknown'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text">{c.distinct_reporters} reporters</p>
                      <p className="text-xs text-text-dim">{c.occurrences} occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-text-dim text-center italic">
        Only hash-based fingerprints are stored. No message text is ever shared.
      </p>
    </div>
  );
}
