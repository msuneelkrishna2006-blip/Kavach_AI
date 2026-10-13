import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi } from '../api/index.js';
import { Settings as SettingsIcon, User, Lock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [storeHistory, setStoreHistory] = useState(user?.store_history ?? true);
  const [contributeToRadar, setContributeToRadar] = useState(user?.contribute_to_radar ?? true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({ fullName, preferredLanguage: language, storeHistory, contributeToRadar });
      await refreshUser(); toast.success('Saved');
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 10) { toast.error('Min 10 characters'); return; }
    setChangingPw(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); toast.success('Password changed');
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
    finally { setChangingPw(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="display-sm text-text">Settings</h1>

      <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
        <h2 className="font-['Sora'] font-semibold text-text flex items-center gap-2"><User className="w-5 h-5" /> Profile</h2>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Full name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100}
            className="w-full px-4 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-emerald/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full px-4 py-2.5 bg-midnight border border-border rounded-lg text-text-muted text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5 flex items-center gap-1"><Globe className="w-4 h-4" /> Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-emerald/50">
            <option value="en">English</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input type="checkbox" checked={storeHistory} onChange={e => setStoreHistory(e.target.checked)} className="w-4 h-4 rounded accent-emerald" />
            Save scan history by default
          </label>
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input type="checkbox" checked={contributeToRadar} onChange={e => setContributeToRadar(e.target.checked)} className="w-4 h-4 rounded accent-emerald" />
            Contribute to Threat Radar by default
          </label>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="px-6 py-2.5 bg-emerald hover:bg-emerald-dim disabled:opacity-40 text-midnight font-medium rounded-lg transition-colors text-sm">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
        <h2 className="font-['Sora'] font-semibold text-text flex items-center gap-2"><Lock className="w-5 h-5" /> Password</h2>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Current password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm focus:outline-none focus:border-emerald/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">New password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 10 chars, letter + number"
            className="w-full px-4 py-2.5 bg-midnight border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-emerald/50" />
        </div>
        <button onClick={changePassword} disabled={changingPw || !currentPassword || !newPassword}
          className="px-6 py-2.5 bg-blue/8 border border-blue/20 text-blue disabled:opacity-40 font-medium rounded-lg hover:bg-blue/15 transition-colors text-sm">
          {changingPw ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}
