import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/index.js';
import { Shield, Search, AlertTriangle, Lock, TrendingUp, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const riskColors = { low: 'text-risk-low', medium: 'text-risk-medium', high: 'text-risk-high', critical: 'text-risk-critical' };
const riskBg = { low: 'risk-badge-low', medium: 'risk-badge-medium', high: 'risk-badge-high', critical: 'risk-badge-critical' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-kavach-surface-2 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-kavach-surface rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link to="/app/analyze" className="inline-flex items-center gap-2 px-4 py-2 bg-kavach-emerald hover:bg-kavach-emerald-dark text-white font-medium rounded-lg transition-colors text-sm">
          <Search className="w-4 h-4" /> New Analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-kavach-blue/10"><Search className="w-5 h-5 text-kavach-blue" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalScans || 0}</p>
              <p className="text-xs text-kavach-text-muted">Total Scans</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-kavach-red/10"><AlertTriangle className="w-5 h-5 text-kavach-red" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.highRiskScans || 0}</p>
              <p className="text-xs text-kavach-text-muted">High Risk Detected</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-kavach-saffron/10"><Lock className="w-5 h-5 text-kavach-saffron" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalPiiRedactions || 0}</p>
              <p className="text-xs text-kavach-text-muted">PII Redactions</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-kavach-emerald/10"><Shield className="w-5 h-5 text-kavach-emerald" /></div>
            <div>
              <p className="text-2xl font-bold text-white">Active</p>
              <p className="text-xs text-kavach-text-muted">Protection Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick analyze */}
      <div className="p-6 rounded-xl bg-kavach-surface border border-kavach-border">
        <h2 className="text-lg font-semibold text-white mb-3">Quick Analyze</h2>
        <p className="text-sm text-kavach-text-muted mb-4">Paste a suspicious message to get started.</p>
        <Link to="/app/analyze" className="inline-flex items-center gap-2 px-4 py-2.5 bg-kavach-emerald/10 border border-kavach-emerald/20 text-kavach-emerald font-medium rounded-lg hover:bg-kavach-emerald/20 transition-colors text-sm">
          Open Analyzer <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent scans */}
      {stats?.recentScans?.length > 0 && (
        <div className="p-6 rounded-xl bg-kavach-surface border border-kavach-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
            <Link to="/app/history" className="text-sm text-kavach-emerald hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {stats.recentScans.map(scan => (
              <Link key={scan.id} to={`/app/scans/${scan.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-kavach-bg hover:bg-kavach-surface-2 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${riskBg[scan.risk_level]}`}>
                    {scan.risk_level.toUpperCase()}
                  </span>
                  <span className="text-sm text-kavach-text">{scan.input_type} • Score: {scan.final_score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-kavach-text-muted">{new Date(scan.created_at).toLocaleDateString()}</span>
                  <ArrowRight className="w-4 h-4 text-kavach-text-muted group-hover:text-kavach-emerald transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
