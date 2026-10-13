import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scanApi } from '../api/index.js';
import { History as HistoryIcon, Search, Trash2,
         AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const riskBadge = { low: 'risk-low', medium: 'risk-medium',
                    high: 'risk-high', critical: 'risk-critical' };

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ riskLevel: '', mode: '', page: 1 });

  const loadScans = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.mode) params.mode = filters.mode;
      const { data } = await scanApi.getScans(params);
      setScans(data.data);
      setMeta(data.meta);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadScans(); }, [filters]);

  const clearAll = async () => {
    if (!confirm('Clear ALL scan history? This cannot be undone.')) return;
    try {
      await scanApi.clearAll();
      setScans([]); setMeta({ total: 0, page: 1, totalPages: 1 });
      toast.success('History cleared');
    } catch { toast.error('Failed to clear'); }
  };

  const deleteScan = async (id) => {
    try {
      await scanApi.deleteScan(id);
      setScans(scans.filter(s => s.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="display-sm text-text">History</h1>
        {scans.length > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5
                      text-sm text-red hover:bg-red/8
                      rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filters.riskLevel}
          onChange={e => setFilters(f => ({ ...f, riskLevel: e.target.value, page: 1 }))}
          className="px-3 py-2 bg-surface border border-border
                    rounded-lg text-sm text-text focus:outline-none">
          <option value="">All levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.mode}
          onChange={e => setFilters(f => ({ ...f, mode: e.target.value, page: 1 }))}
          className="px-3 py-2 bg-surface border border-border
                    rounded-lg text-sm text-text focus:outline-none">
          <option value="">All modes</option>
          <option value="scam_check">Scam Check</option>
          <option value="ai_prompt_check">AI Safe-Share</option>
          <option value="url_inspect">URL Inspector</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="w-10 h-10 text-text-dim mb-3" />
          <h3 className="font-['Sora'] font-semibold text-text mb-1">
            No scans yet
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Paste a message to check it.
          </p>
          <Link to="/app/analyze"
            className="px-4 py-2 bg-emerald text-midnight
                      rounded-lg text-sm font-medium">
            Go to Analyzer
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => (
            <div key={scan.id}
              className="flex items-center justify-between p-3
                        rounded-lg bg-surface border border-border
                        hover:border-emerald/15 transition-colors
                        group">
              <Link to={`/app/scans/${scan.id}`}
                className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`risk-badge ${riskBadge[scan.risk_level]}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {scan.risk_level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">
                    {scan.mode.replace(/_/g, ' ')} · {scan.input_type} · {scan.final_score}/100
                  </p>
                  <p className="text-xs text-text-dim">
                    {new Date(scan.created_at).toLocaleString()}
                  </p>
                </div>
                {scan.ai_used && (
                  <span className="px-1.5 py-0.5 rounded text-[10px]
                                 bg-purple/15 text-purple font-semibold">
                    AI
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-text-dim
                                      group-hover:text-emerald" />
              </Link>
              <button onClick={e => { e.preventDefault(); deleteScan(scan.id); }}
                className="ml-2 p-1.5 text-text-dim hover:text-red
                          transition-colors rounded" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={meta.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1.5 text-sm bg-surface border
                      border-border rounded-lg disabled:opacity-40
                      text-text-muted">
            Previous
          </button>
          <span className="text-sm text-text-muted">
            {meta.page} / {meta.totalPages}
          </span>
          <button disabled={meta.page >= meta.totalPages}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1.5 text-sm bg-surface border
                      border-border rounded-lg disabled:opacity-40
                      text-text-muted">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
