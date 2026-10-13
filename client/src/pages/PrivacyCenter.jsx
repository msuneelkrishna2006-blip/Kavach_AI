import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/index.js';
import { Lock, Download, Trash2, Shield, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivacyCenter() {
  const { logout } = useAuth();
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await userApi.exportData();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `kavachai-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Password required'); return; }
    setDeleting(true);
    try {
      await userApi.deleteAccount({ password: deletePassword });
      toast.success('Account deleted'); logout();
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="display-sm text-text">Privacy Center</h1>

      <div className="rounded-xl bg-emerald/5 border border-emerald/15 p-5">
        <h2 className="font-['Sora'] font-semibold text-emerald mb-3 flex items-center gap-2"><Shield className="w-5 h-5" /> Our promise</h2>
        <ul className="space-y-2 text-sm text-text">
          <li>• <strong>Your data stays yours.</strong> Never sold, shared, or used for ads.</li>
          <li>• <strong>PII redacted before AI.</strong> Aadhaar, PAN, cards, OTP — never sent to Gemini.</li>
          <li>• <strong>History is opt-in.</strong> You control what's saved.</li>
          <li>• <strong>Radar uses hashes only.</strong> No text stored in community data.</li>
          <li>• <strong>Export or delete anytime.</strong> Your data, your control.</li>
        </ul>
      </div>

      <div className="rounded-xl bg-surface border border-border p-5">
        <h2 className="font-['Sora'] font-semibold text-text mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-blue" /> Data retention</h2>
        <div className="space-y-2 text-sm text-text-muted">
          <p>• <strong>Scans:</strong> Until you delete. Only sanitized text saved (if opted in).</p>
          <p>• <strong>Signals:</strong> Anonymous hashes remain as aggregates after account deletion.</p>
          <p>• <strong>Account:</strong> Deleted immediately. Cascades to scans, feedback, drills.</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface border border-border p-5">
        <h2 className="font-['Sora'] font-semibold text-text mb-3 flex items-center gap-2"><Download className="w-5 h-5 text-cyan" /> Export data</h2>
        <p className="text-sm text-text-muted mb-4">Download all your data as JSON.</p>
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-2.5 bg-cyan/8 border border-cyan/20 text-cyan font-medium rounded-lg hover:bg-cyan/15 transition-colors text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Download'}
        </button>
      </div>

      <div className="rounded-xl bg-surface border border-red/15 p-5">
        <h2 className="font-['Sora'] font-semibold text-red mb-3 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete account</h2>
        <p className="text-sm text-text-muted mb-4">Permanently delete your account and all data.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2.5 bg-red/8 border border-red/20 text-red font-medium rounded-lg hover:bg-red/15 transition-colors text-sm">
            Delete my account
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg bg-red/5 border border-red/10">
            <p className="text-sm text-red font-semibold">⚠ This will permanently delete your account, scans, and feedback.</p>
            <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              placeholder="Confirm with your password"
              className="w-full px-3 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-red/50" />
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting || !deletePassword}
                className="px-4 py-2 bg-red hover:bg-red/80 disabled:opacity-40 text-white font-medium rounded-lg text-sm">
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeletePassword(''); }}
                className="px-4 py-2 bg-surface border border-border text-text-muted rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
