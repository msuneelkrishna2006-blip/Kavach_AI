import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      const msg = err.response?.data?.error?.message
                  || 'Login failed';
      toast.error(msg);
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
          Check before you click,<br />share, or pay.
        </h2>
        <div className="space-y-3 mt-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald mt-0.5
                            flex-shrink-0" />
            <p className="text-sm text-text-muted">
              Your data is redacted before any AI sees it.
              Aadhaar, PAN, OTP, phone numbers — all replaced
              with safe placeholders.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald mt-0.5
                              flex-shrink-0" />
            <p className="text-sm text-text-muted">
              Export or delete your data at any time.
              We never sell, share, or use your data
              for advertising.
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
            Sign in
          </h1>
          <p className="text-text-muted text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register"
              className="text-emerald hover:underline">
              Create one
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email"
                className="block text-sm font-medium text-text mb-1.5">
                Email
              </label>
              <input id="email" type="email" required
                autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)}
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
                autoComplete="current-password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface
                          border border-border rounded-lg
                          text-text text-sm
                          placeholder:text-text-dim
                          focus:outline-none
                          focus:border-emerald/50
                          transition-colors"
                placeholder="••••••••••" />
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
                : <><ArrowRight className="w-4 h-4" /> Sign in</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
