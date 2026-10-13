import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, Search, History, Radio,
  Brain, Lock, Settings, ShieldAlert, Menu, X, LogOut
} from 'lucide-react';

const NAV = [
  { to: '/app',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/analyze',  icon: Search,          label: 'Analyze' },
  { to: '/app/history',  icon: History,         label: 'History' },
  { to: '/app/radar',    icon: Radio,           label: 'Radar' },
  { to: '/app/awareness',icon: Brain,           label: 'Awareness' },
  { to: '/app/privacy',  icon: Lock,            label: 'Privacy' },
  { to: '/app/settings', icon: Settings,        label: 'Settings' },
];

const ADMIN_NAV = [
  { to: '/app/admin', icon: ShieldAlert, label: 'Admin' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'analyst';
  const links = isAdmin ? [...NAV, ...ADMIN_NAV] : NAV;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-midnight flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface
                        border-r border-border fixed inset-y-0 z-40">
        <div className="px-5 py-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald" />
            <span className="font-['Sora'] font-bold text-text">
              KavachAI
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg
                 text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-emerald/10 text-emerald'
                   : 'text-text-muted hover:text-text hover:bg-surface-2'
                 }`
              }>
              <l.icon className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-emerald/10
                           flex items-center justify-center
                           text-emerald text-xs font-bold">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text truncate">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-text-dim truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2
                      rounded-lg text-sm text-text-muted
                      hover:text-text hover:bg-surface-2
                      transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50
                     nav-glass px-4 py-3 flex items-center
                     justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald" />
          <span className="font-['Sora'] font-bold text-text text-sm">
            KavachAI
          </span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="text-text-muted hover:text-text p-1"
          aria-label="Toggle menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-midnight/80"
               onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 right-0
                         bg-surface border-b border-border
                         p-4 space-y-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5
                   rounded-lg text-sm font-medium
                   ${isActive
                     ? 'bg-emerald/10 text-emerald'
                     : 'text-text-muted hover:text-text'
                   }`
                }>
                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3
                        py-2.5 rounded-lg text-sm text-text-muted
                        hover:text-text">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
