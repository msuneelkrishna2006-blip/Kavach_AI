import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-kavach-bg px-4">
      <div className="text-center">
        <Shield className="w-16 h-16 text-kavach-emerald mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-kavach-text-muted mb-8">Page not found</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-kavach-emerald hover:bg-kavach-emerald-dark text-white font-medium rounded-xl transition-colors">
          <Home className="w-5 h-5" /> Go Home
        </Link>
      </div>
    </div>
  );
}
