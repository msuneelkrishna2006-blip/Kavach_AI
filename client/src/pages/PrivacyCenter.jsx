import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/index.js';
import { Lock, Download, Trash2, Shield, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivacyCenter() {
  const { user, logout } = useAuth();
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await userApi.exportData();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kavachai-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Password required'); return; }
    setDeleting(true);
    try {
      await userApi.deleteAccount({ password: deletePassword });
      toast.success('Account deleted. Goodbye.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Deletion failed');
    } finally { setDeleting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Lock className="w-6 h-6" /> Privacy Center</h1>

      {/* Privacy Promise */}
      <div className="p-6 rounded-2xl bg-kavach-emerald/5 border border-kavach-emerald/20">
        <h2 className="text-lg font-semibold text-kavach-emerald mb-3 flex items-center gap-2"><Shield className="w-5 h-5" /> Our Privacy Promise</h2>
        <ul className="space-y-2 text-sm text-kavach-text">
          <li>• <strong>Your data stays yours.</strong> We never sell, share, or use your data for advertising.</li>
          <li>• <strong>PII is redacted before AI analysis.</strong> Sensitive data like Aadhaar, PAN, card numbers are never sent to AI.</li>
          <li>• <strong>History is opt-in.</strong> You control whether scans are saved.</li>
          <li>• <strong>Threat Radar uses only hashes.</strong> No message text is stored in the community radar.</li>
          <li>• <strong>Export or delete anytime.</strong> Your data, your control.</li>
          <li>• <strong>No third-party trackers.</strong> We don't use analytics or tracking pixels.</li>
        </ul>
      </div>

      {/* Data Retention */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-kavach-blue" /> Data Retention</h2>
        <div className="space-y-2 text-sm text-kavach-text-muted">
          <p>• <strong>Scan history:</strong> Stored until you delete it. Only sanitized text is saved (if you opt in).</p>
          <p>• <strong>Threat signals:</strong> Anonymous hash-based fingerprints. These remain as aggregate data even after account deletion, since they contain no personal information.</p>
          <p>• <strong>Account data:</strong> Deleted immediately upon account deletion. Cascades to scans, feedback, and drill attempts.</p>
          <p>• <strong>Audit logs:</strong> User reference set to null upon account deletion. Action records retained for security.</p>
        </div>
      </div>

      {/* Export */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Download className="w-5 h-5 text-kavach-cyan" /> Export Your Data</h2>
        <p className="text-sm text-kavach-text-muted mb-4">Download all your data as a JSON file: profile, scans, feedback, and drill attempts.</p>
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-2.5 bg-kavach-cyan/10 border border-kavach-cyan/20 text-kavach-cyan font-medium rounded-lg hover:bg-kavach-cyan/20 transition-colors text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Download My Data'}
        </button>
      </div>

      {/* Delete Account */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-red/20">
        <h2 className="text-lg font-semibold text-kavach-red mb-3 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete Account</h2>
        <p className="text-sm text-kavach-text-muted mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 bg-kavach-red/10 border border-kavach-red/20 text-kavach-red font-medium rounded-lg hover:bg-kavach-red/20 transition-colors text-sm">
            I want to delete my account
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg bg-kavach-red/5 border border-kavach-red/10">
            <p className="text-sm text-kavach-red font-semibold">⚠️ This will permanently delete:</p>
            <ul className="text-sm text-kavach-text-muted list-disc list-inside">
              <li>Your account and profile</li>
              <li>All scan history and reports</li>
              <li>All feedback and drill attempts</li>
            </ul>
            <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm"
              className="w-full px-3 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text text-sm focus:outline-none focus:border-kavach-red/50" />
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting || !deletePassword}
                className="px-4 py-2 bg-kavach-red hover:bg-kavach-red-dark disabled:opacity-50 text-white font-medium rounded-lg text-sm">
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                className="px-4 py-2 bg-kavach-surface border border-kavach-border text-kavach-text-muted rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
