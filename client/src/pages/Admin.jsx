import { useState, useEffect } from 'react';
import { adminApi } from '../api/index.js';
import { RoleGuard } from '../components/ProtectedRoute';
import { Users, BarChart3, Brain, FileText, ShieldAlert,
         AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Admin() {
  const [tab, setTab] = useState('analytics');

  return (
    <RoleGuard roles={['analyst', 'admin']}>
      <div className="space-y-6">
        <h1 className="display-sm text-text">Admin Console</h1>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'briefing',  label: 'AI Briefing', icon: Brain },
            { id: 'users',     label: 'Users', icon: Users },
            { id: 'audit',     label: 'Audit Log', icon: FileText },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                ${tab === t.id ? 'bg-purple/8 text-purple border-purple/20' : 'bg-surface border-border text-text-muted hover:text-text'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
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
  useEffect(() => { adminApi.getAnalytics().then(r => setData(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="skeleton h-64 rounded-xl" />;
  if (!data) return null;

  const catData = Object.entries(data.categoryDistribution || {}).map(([cat, count]) => ({ category: cat.replace(/_/g, ' '), count })).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total scans', data.totalScans], ['AI-analyzed', data.aiUsage?.used || 0],
          ['Feedback', Object.values(data.feedbackDistribution || {}).reduce((a, b) => a + b, 0)],
          ['Critical', data.riskDistribution?.critical || 0],
        ].map(([l, v]) => (
          <div key={l} className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-['Sora'] font-bold text-text">{v}</p>
            <p className="text-xs text-text-muted">{l}</p>
          </div>
        ))}
      </div>
      {catData.length > 0 && (
        <div className="rounded-xl bg-surface border border-border p-5">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Top categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={catData}>
              <XAxis dataKey="category" tick={{ fill: '#8896b3', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#8896b3' }} />
              <Tooltip contentStyle={{ backgroundColor: '#151d30', border: '1px solid #243049', borderRadius: '8px', color: '#e8ecf4' }} />
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
    try { const { data } = await adminApi.generateBriefing(); setBriefing(data.data); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <button onClick={generate} disabled={loading}
        className="px-4 py-2.5 bg-purple/8 border border-purple/20 text-purple font-medium rounded-lg hover:bg-purple/15 transition-colors text-sm flex items-center gap-2">
        <Brain className="w-4 h-4" /> {loading ? 'Generating…' : 'Generate briefing'}
      </button>
      {briefing && (
        <div className="rounded-xl bg-surface border border-border p-5">
          <h2 className="display-sm text-text mb-2">{briefing.headline}</h2>
          <p className="text-sm text-text-muted mb-4">{briefing.period}</p>
          {briefing.top_trends?.map((t, i) => (
            <div key={i} className="mb-3 p-3 rounded-lg bg-midnight">
              <h4 className="text-sm font-semibold text-text">{t.category}</h4>
              <p className="text-sm text-text-muted mt-1">{t.observation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getUsers().then(r => setUsers(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
  const changeRole = async (id, role) => {
    try { await adminApi.updateUserRole(id, { role }); setUsers(users.map(u => u.id === id ? { ...u, role } : u)); toast.success('Updated'); }
    catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
  };
  if (loading) return <div className="skeleton h-32 rounded-xl" />;

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-text-muted font-medium">Email</th>
            <th className="px-4 py-3 text-left text-text-muted font-medium">Name</th>
            <th className="px-4 py-3 text-left text-text-muted font-medium">Role</th>
            <th className="px-4 py-3 text-left text-text-muted font-medium">Joined</th>
          </tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2">
              <td className="px-4 py-3 text-text">{u.email}</td>
              <td className="px-4 py-3 text-text">{u.full_name}</td>
              <td className="px-4 py-3">
                <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                  className="px-2 py-1 bg-midnight border border-border rounded text-xs text-text">
                  <option value="user">user</option><option value="analyst">analyst</option><option value="admin">admin</option>
                </select>
              </td>
              <td className="px-4 py-3 text-text-dim text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getAuditLogs({ limit: 50 }).then(r => setLogs(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="skeleton h-32 rounded-xl" />;

  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-text-muted font-medium">Time</th>
            <th className="px-4 py-3 text-left text-text-muted font-medium">Action</th>
            <th className="px-4 py-3 text-left text-text-muted font-medium">Resource</th>
          </tr></thead>
          <tbody>{logs.map(l => (
            <tr key={l.id} className="border-b border-border/50">
              <td className="px-4 py-3 text-text-dim text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-text font-mono text-xs">{l.action}</td>
              <td className="px-4 py-3 text-text-dim text-xs">{l.resource_type} {l.resource_id?.slice(0, 8)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
