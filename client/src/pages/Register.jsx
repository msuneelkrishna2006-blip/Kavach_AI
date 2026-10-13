import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', language: 'en',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 10) {
      toast.error('Password must be at least 10 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      navigate('/app');
    } catch (err) {
      toast.error(
        err.response?.data?.error?.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight grid grid-cols-1
                    lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-center
                      px-12 xl:px-20 bg-surface/60">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <Shield className="w-8 h-8 text-emerald" />
          <span className="font-['Sora'] text-xl font-bold text-text">
            KavachAI
          </span>
        </Link>
        <h2 className="display-md text-text mb-4">
          Privacy-first scam defense,<br />for everyone.
        </h2>
        <div className="space-y-3 mt-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald mt-0.5
                            flex-shrink-0" />
            <p className="text-sm text-text-muted">
              We redact all sensitive data — Aadhaar, PAN,
              phone, OTP, cards — before any AI analysis.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-emerald mt-0.5
                             flex-shrink-0" />
            <p className="text-sm text-text-muted">
              Explanations in English, Telugu, and Hindi.
              Family alerts you can share instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald" />
              <span className="font-['Sora'] text-lg font-bold
                              text-text">
                KavachAI
              </span>
            </Link>
          </div>

          <h1 className="display-sm text-text mb-1">
            Create account
          </h1>
          <p className="text-text-muted text-sm mb-8">
            Already have an account?{' '}
            <Link to="/login"
              className="text-emerald hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName"
                className="block text-sm font-medium text-text mb-1.5">
                Full name
              </label>
              <input id="fullName" type="text" required
                autoComplete="name" value={form.fullName}
                onChange={set('fullName')} maxLength={100}
                className="w-full px-4 py-2.5 bg-surface
                          border border-border rounded-lg
                          text-text text-sm
                          placeholder:text-text-dim
                          focus:outline-none
                          focus:border-emerald/50
                          transition-colors"
                placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email"
                className="block text-sm font-medium text-text mb-1.5">
                Email
              </label>
              <input id="email" type="email" required
                autoComplete="email" value={form.email}
                onChange={set('email')}
                className="w-full px-4 py-2.5 bg-surface
                          border border-border rounded-lg
                          text-text text-sm
                          placeholder:text-text-dim
                          focus:outline-none
                          focus:border-emerald/50
                          transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password"
                className="block text-sm font-medium text-text mb-1.5">
                Password
              </label>
              <input id="password" type="password" required
                autoComplete="new-password" value={form.password}
                onChange={set('password')}
                className="w-full px-4 py-2.5 bg-surface
                          border border-border rounded-lg
                          text-text text-sm
                          placeholder:text-text-dim
                          focus:outline-none
                          focus:border-emerald/50
                          transition-colors"
                placeholder="Min 10 chars, letter + number" />
              <p className="text-xs text-text-dim mt-1">
                At least 10 characters with a letter and a number.
              </p>
            </div>
            <div>
              <label htmlFor="language"
                className="block text-sm font-medium text-text mb-1.5">
                Preferred language
              </label>
              <select id="language" value={form.language}
                onChange={set('language')}
                className="w-full px-4 py-2.5 bg-surface
                          border border-border rounded-lg
                          text-text text-sm
                          focus:outline-none
                          focus:border-emerald/50">
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald hover:bg-emerald-dim
                        disabled:opacity-50 text-midnight
                        font-semibold rounded-lg transition-colors
                        flex items-center justify-center gap-2
                        text-sm">
              {loading
                ? <div className="animate-spin rounded-full
                                 h-4 w-4 border-t-2 border-midnight" />
                : <><ArrowRight className="w-4 h-4" /> Create account</>
              }
            </button>
          </form>

          <p className="text-xs text-text-dim mt-4 text-center">
            By creating an account you agree to our privacy policy.
            We never sell or share your data.
          </p>
        </div>
      </div>
    </div>
  );
}
