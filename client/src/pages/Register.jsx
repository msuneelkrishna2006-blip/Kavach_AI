import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 10) { toast.error('Password must be at least 10 characters'); return; }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { toast.error('Password must include a letter and a number'); return; }
    setLoading(true);
    try {
      await register(email, password, fullName);
      toast.success('Account created! Welcome to KavachAI.');
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
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
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-kavach-text-muted mt-1">Start protecting yourself from digital fraud</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-kavach-surface border border-kavach-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required maxLength={100}
              className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-kavach-text mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={10}
                className="w-full px-4 py-2.5 bg-kavach-bg border border-kavach-border rounded-lg text-kavach-text placeholder-kavach-text-muted/50 focus:outline-none focus:border-kavach-emerald/50 pr-10"
                placeholder="Min 10 chars, include letter + number" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-kavach-text-muted hover:text-kavach-text">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-kavach-text-muted mt-1">At least 10 characters with a letter and a number</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-kavach-text-muted mt-4">
          Already have an account?{' '}<Link to="/login" className="text-kavach-emerald hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
