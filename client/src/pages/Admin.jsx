import { useState, useEffect } from 'react';
import { adminApi } from '../api/index.js';
import { RoleGuard } from '../components/ProtectedRoute';
import { Users, BarChart3, Brain, FileText, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Admin() {
  const [tab, setTab] = useState('analytics');
  
  return (
    <RoleGuard roles={['analyst', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-kavach-purple" /> Admin Console</h1>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'briefing', label: 'AI Briefing', icon: Brain },
            { id: 'users', label: 'Users', icon: Users, adminOnly: true },
            { id: 'audit', label: 'Audit Log', icon: FileText, adminOnly: true },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-kavach-purple/10 text-kavach-purple border border-kavach-purple/20' : 'bg-kavach-surface border border-kavach-border text-kavach-text-muted hover:text-kavach-text'
              }`}><t.icon className="w-4 h-4" /> {t.label}</button>
          ))}
        </div>

        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'briefing' && <BriefingTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </RoleGuard>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 bg-kavach-surface rounded-xl animate-pulse" />;
  if (!data) return null;

  const riskData = Object.entries(data.riskDistribution || {}).map(([level, count]) => ({ level, count }));
  const catData = Object.entries(data.categoryDistribution || {}).map(([cat, count]) => ({ category: cat.replace(/_/g, ' '), count })).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
          <p className="text-2xl font-bold text-white">{data.totalScans}</p>
          <p className="text-xs text-kavach-text-muted">Total Scans</p>
        </div>
        <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
          <p className="text-2xl font-bold text-white">{data.aiUsage?.used || 0}</p>
          <p className="text-xs text-kavach-text-muted">AI-Analyzed</p>
        </div>
        <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
          <p className="text-2xl font-bold text-white">{Object.values(data.feedbackDistribution || {}).reduce((a, b) => a + b, 0)}</p>
          <p className="text-xs text-kavach-text-muted">Feedback Items</p>
        </div>
        <div className="p-4 rounded-xl bg-kavach-surface border border-kavach-border text-center">
          <p className="text-2xl font-bold text-white">{data.riskDistribution?.critical || 0}</p>
          <p className="text-xs text-kavach-text-muted">Critical Detections</p>
        </div>
      </div>

      {catData.length > 0 && (
        <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
          <h3 className="text-lg font-semibold text-white mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={catData}>
              <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function BriefingTab() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.generateBriefing();
      setBriefing(data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Briefing generation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <button onClick={generate} disabled={loading}
        className="px-4 py-2.5 bg-kavach-purple/10 border border-kavach-purple/20 text-kavach-purple font-medium rounded-lg hover:bg-kavach-purple/20 transition-colors text-sm flex items-center gap-2">
        <Brain className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate AI Briefing'}
      </button>

      {briefing && (
        <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-2">{briefing.headline}</h2>
          <p className="text-sm text-kavach-text-muted mb-4">{briefing.period}</p>
          {briefing.top_trends?.map((t, i) => (
            <div key={i} className="mb-4 p-4 rounded-lg bg-kavach-bg">
              <h4 className="text-sm font-semibold text-kavach-text">{t.category}</h4>
              <p className="text-sm text-kavach-text-muted mt-1">{t.observation}</p>
            </div>
          ))}
          {briefing.recommended_awareness_actions?.length > 0 && (
            <div className="mt-4"><h4 className="text-sm font-semibold text-kavach-text-muted mb-2">Recommended Actions</h4>
              {briefing.recommended_awareness_actions.map((a, i) => <p key={i} className="text-sm text-kavach-text">• {a}</p>)}
            </div>
          )}
          {briefing.caveats?.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-kavach-saffron/10 text-sm text-kavach-saffron">
              {briefing.caveats.map((c, i) => <p key={i}>⚠️ {c}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers().then(r => setUsers(r.data.data)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, { role });
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed to update role'); }
  };

  if (loading) return <div className="h-32 bg-kavach-surface rounded-xl animate-pulse" />;

  return (
    <div className="rounded-2xl bg-kavach-surface border border-kavach-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-kavach-border">
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Email</th>
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Name</th>
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Role</th>
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Joined</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-kavach-border/50 hover:bg-kavach-surface-2">
                <td className="px-4 py-3 text-kavach-text">{u.email}</td>
                <td className="px-4 py-3 text-kavach-text">{u.full_name}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className="px-2 py-1 bg-kavach-bg border border-kavach-border rounded text-xs text-kavach-text">
                    <option value="user">user</option>
                    <option value="analyst">analyst</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-kavach-text-muted text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAuditLogs({ limit: 50 }).then(r => setLogs(r.data.data)).catch(() => toast.error('Failed to load audit logs')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 bg-kavach-surface rounded-xl animate-pulse" />;

  return (
    <div className="rounded-2xl bg-kavach-surface border border-kavach-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-kavach-border">
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Time</th>
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Action</th>
            <th className="px-4 py-3 text-left text-kavach-text-muted font-medium">Resource</th>
          </tr></thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b border-kavach-border/50">
                <td className="px-4 py-3 text-kavach-text-muted text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-kavach-text font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3 text-kavach-text-muted text-xs">{log.resource_type} {log.resource_id?.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
