import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/index.js';
import { Shield, Search, History, AlertTriangle, TrendingUp,
         ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const riskBadge = {
  low: 'risk-low', medium: 'risk-medium',
  high: 'risk-high', critical: 'risk-critical',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="display-sm text-text">
          Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Paste a message to check it, or review your history.
        </p>
      </div>

      {/* Quick action */}
      <Link to="/app/analyze"
        className="flex items-center gap-3 p-4 rounded-xl
                  bg-emerald/8 border border-emerald/20
                  hover:bg-emerald/12 transition-colors group">
        <div className="w-10 h-10 rounded-lg bg-emerald/15
                       flex items-center justify-center">
          <Search className="w-5 h-5 text-emerald" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">
            Check a message
          </p>
          <p className="text-xs text-text-muted">
            Paste a suspicious SMS, WhatsApp, or email.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-text-muted
                              group-hover:text-emerald
                              transition-colors" />
      </Link>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total scans"
                      value={stats.totalScans ?? 0}
                      icon={Search} />
            <StatCard label="This week"
                      value={stats.thisWeek ?? 0}
                      icon={TrendingUp} />
            <StatCard label="High risk"
                      value={stats.highRisk ?? 0}
                      icon={AlertTriangle}
                      accent="text-risk-high" />
            <StatCard label="AI used"
                      value={stats.aiUsed ?? 0}
                      icon={Shield} />
          </div>

          {/* Recent scans */}
          {stats.recentScans?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-muted
                              uppercase tracking-wider">
                  Recent scans
                </h2>
                <Link to="/app/history"
                  className="text-xs text-emerald hover:underline">
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {stats.recentScans.slice(0, 5).map(scan => (
                  <Link key={scan.id} to={`/app/scans/${scan.id}`}
                    className="flex items-center gap-3 p-3
                              rounded-lg bg-surface border
                              border-border
                              hover:border-emerald/20
                              transition-colors">
                    <span className={`risk-badge ${riskBadge[scan.risk_level]}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {scan.risk_level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">
                        {scan.mode.replace(/_/g, ' ')} ·{' '}
                        {scan.input_type} · Score: {scan.final_score}
                      </p>
                      <p className="text-xs text-text-dim">
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-surface border border-border
                       p-8 text-center">
          <History className="w-10 h-10 text-text-dim mx-auto mb-3" />
          <p className="text-sm text-text-muted">
            No scans yet. Check a message to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent || 'text-text-muted'}`} />
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <p className="text-2xl font-['Sora'] font-bold text-text">
        {value}
      </p>
    </div>
  );
}
