import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-midnight px-4">
      <div className="text-center">
        <Shield className="w-14 h-14 text-text-dim mx-auto mb-6
                          opacity-30" />
        <h1 className="text-6xl font-['Sora'] font-bold text-text
                      mb-3">404</h1>
        <p className="text-lg text-text-muted mb-8">
          Page not found
        </p>
        <Link to="/"
          className="inline-flex items-center gap-2 px-5 py-3
                    bg-emerald hover:bg-emerald-dim text-midnight
                    font-medium rounded-lg transition-colors text-sm">
          <Home className="w-4 h-4" /> Go home
        </Link>
      </div>
    </div>
  );
}
