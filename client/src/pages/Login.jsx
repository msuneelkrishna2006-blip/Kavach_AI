import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-kavach-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-10 h-10 text-kavach-emerald" />
            <span className="text-2xl font-bold gradient-text">KavachAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-kavach-text-muted mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50 pr-10"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-kavach-text-muted hover:text-kavach-text">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-kavach-text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-kavach-emerald hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
