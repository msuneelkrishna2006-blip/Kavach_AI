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
  const [changingPassword, setChangingPassword] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({
        fullName, preferredLanguage: language,
        storeHistory, contributeToRadar,
      });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 10) { toast.error('New password must be at least 10 characters'); return; }
    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword('');
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><SettingsIcon className="w-6 h-6" /> Settings</h1>

      {/* Profile */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User className="w-5 h-5" /> Profile</h2>
        <div>
          <label className="block text-sm font-medium text-kavach-text mb-1.5">Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100}
            className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-kavach-text mb-1.5">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text-muted cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-kavach-text mb-1.5 flex items-center gap-1"><Globe className="w-4 h-4" /> Preferred Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50">
            <option value="en">English</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="hi">Hindi (हिंदी)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-kavach-text cursor-pointer">
            <input type="checkbox" checked={storeHistory} onChange={e => setStoreHistory(e.target.checked)} className="w-4 h-4 rounded" />
            Save scan history by default
          </label>
          <label className="flex items-center gap-2 text-sm text-kavach-text cursor-pointer">
            <input type="checkbox" checked={contributeToRadar} onChange={e => setContributeToRadar(e.target.checked)} className="w-4 h-4 rounded" />
            Contribute to Community Threat Radar by default
          </label>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="px-6 py-2.5 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Password */}
      <div className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h2>
        <div>
          <label className="block text-sm font-medium text-kavach-text mb-1.5">Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-kavach-text mb-1.5">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 10 chars, include letter + number"
            className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text focus:outline-none focus:border-kavach-emerald/50" />
        </div>
        <button onClick={changePassword} disabled={changingPassword || !currentPassword || !newPassword}
          className="px-6 py-2.5 bg-kavach-blue/10 border border-kavach-blue/20 text-kavach-blue disabled:opacity-50 font-medium rounded-lg hover:bg-kavach-blue/20 transition-colors text-sm">
          {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
