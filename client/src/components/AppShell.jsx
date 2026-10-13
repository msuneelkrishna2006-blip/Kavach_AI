import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, BarChart3, Search, History, Radar, Brain, Settings, Lock, LogOut, Menu, X, ChevronDown, Users, FileText, Home } from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Dashboard', icon: Home, end: true },
  { path: '/app/analyze', label: 'Analyzer', icon: Search },
  { path: '/app/history', label: 'History', icon: History },
  { path: '/app/radar', label: 'Threat Radar', icon: Radar },
  { path: '/app/awareness', label: 'Awareness Lab', icon: Brain },
  { path: '/app/privacy', label: 'Privacy Center', icon: Lock },
  { path: '/app/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { path: '/app/admin', label: 'Admin Console', icon: Users },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-kavach-bg overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-kavach-surface border-r border-kavach-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-kavach-border">
          <Shield className="w-8 h-8 text-kavach-emerald" />
          <div>
            <h1 className="text-lg font-bold gradient-text">KavachAI</h1>
            <p className="text-xs text-kavach-text-muted">Scam Defense Copilot</p>
          </div>
        </div>
        
        <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path, item.end)
                  ? 'bg-kavach-emerald/10 text-kavach-emerald border border-kavach-emerald/20'
                  : 'text-kavach-text-muted hover:text-kavach-text hover:bg-kavach-surface-2'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
          
          {user && ['analyst', 'admin'].includes(user.role) && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold text-kavach-text-muted uppercase tracking-wider">Admin</p>
              </div>
              {adminItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-kavach-purple/10 text-kavach-purple border border-kavach-purple/20'
                      : 'text-kavach-text-muted hover:text-kavach-text hover:bg-kavach-surface-2'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-kavach-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-kavach-emerald/20 flex items-center justify-center text-kavach-emerald font-semibold text-sm">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-kavach-text truncate">{user?.full_name}</p>
              <p className="text-xs text-kavach-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-kavach-text-muted hover:text-kavach-red rounded-lg hover:bg-kavach-red/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-kavach-surface border-b border-kavach-border no-print">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-kavach-text-muted hover:text-kavach-text">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-kavach-emerald/10 text-kavach-emerald border border-kavach-emerald/20">
              <Shield className="w-3 h-3" />
              Privacy Mode
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-kavach-surface-2 text-kavach-text-muted border border-kavach-border">
              {user?.role}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Disclaimer */}
        <footer className="px-4 py-2 text-center text-xs text-kavach-text-muted border-t border-kavach-border bg-kavach-surface no-print">
          KavachAI provides a heuristic risk assessment, not a guarantee.
        </footer>
      </div>
    </div>
  );
}
