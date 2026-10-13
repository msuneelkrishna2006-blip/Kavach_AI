import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scanApi } from '../api/index.js';
import { History as HistoryIcon, Search, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const riskBg = { low: 'risk-badge-low', medium: 'risk-badge-medium', high: 'risk-badge-high', critical: 'risk-badge-critical' };

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
      setScans([]);
      setMeta({ total: 0, page: 1, totalPages: 1 });
      toast.success('All history cleared');
    } catch { toast.error('Failed to clear history'); }
  };

  const deleteScan = async (id) => {
    try {
      await scanApi.deleteScan(id);
      setScans(scans.filter(s => s.id !== id));
      toast.success('Scan deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><HistoryIcon className="w-6 h-6" /> Scan History</h1>
        {scans.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-kavach-red hover:bg-kavach-red/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filters.riskLevel} onChange={e => setFilters(f => ({ ...f, riskLevel: e.target.value, page: 1 }))}
          className="px-3 py-2 bg-kavach-surface border border-kavach-border rounded-lg text-sm text-kavach-text focus:outline-none">
          <option value="">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.mode} onChange={e => setFilters(f => ({ ...f, mode: e.target.value, page: 1 }))}
          className="px-3 py-2 bg-kavach-surface border border-kavach-border rounded-lg text-sm text-kavach-text focus:outline-none">
          <option value="">All Modes</option>
          <option value="scam_check">Scam Check</option>
          <option value="ai_prompt_check">AI Safe-Share</option>
          <option value="url_inspect">URL Inspector</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-kavach-surface rounded-xl animate-pulse" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-kavach-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-kavach-text mb-2">No scans yet</h3>
          <p className="text-kavach-text-muted mb-4">Start analyzing messages to build your history.</p>
          <Link to="/app/analyze" className="px-4 py-2 bg-kavach-emerald text-white rounded-lg text-sm font-medium">
            Go to Analyzer
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => (
            <div key={scan.id} className="flex items-center justify-between p-4 rounded-xl bg-kavach-surface border border-kavach-border hover:border-kavach-emerald/20 transition-colors group">
              <Link to={`/app/scans/${scan.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <span className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap ${riskBg[scan.risk_level]}`}>
                  {scan.risk_level.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kavach-text truncate">
                    {scan.mode.replace('_', ' ')} • {scan.input_type} • Score: {scan.final_score}/100
                  </p>
                  <p className="text-xs text-kavach-text-muted">{new Date(scan.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {scan.ai_used && <span className="px-2 py-0.5 rounded text-[10px] bg-kavach-purple/20 text-kavach-purple font-semibold">AI</span>}
                  <ArrowRight className="w-4 h-4 text-kavach-text-muted group-hover:text-kavach-emerald" />
                </div>
              </Link>
              <button onClick={(e) => { e.preventDefault(); deleteScan(scan.id); }}
                className="ml-2 p-1.5 text-kavach-text-muted hover:text-kavach-red transition-colors rounded" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={meta.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1.5 text-sm bg-kavach-surface border border-kavach-border rounded-lg disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-kavach-text-muted">Page {meta.page} of {meta.totalPages}</span>
          <button disabled={meta.page >= meta.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1.5 text-sm bg-kavach-surface border border-kavach-border rounded-lg disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
