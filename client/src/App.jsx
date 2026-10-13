import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/AppShell';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import ScanReport from './pages/ScanReport';
import History from './pages/History';
import Radar from './pages/Radar';
import Awareness from './pages/Awareness';
import PrivacyCenter from './pages/PrivacyCenter';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2236',
              color: '#e2e8f0',
              border: '1px solid #1e293b',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1a2236' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1a2236' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App */}
          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="analyze" element={<Analyzer />} />
            <Route path="scans/:id" element={<ScanReport />} />
            <Route path="history" element={<History />} />
            <Route path="radar" element={<Radar />} />
            <Route path="awareness" element={<Awareness />} />
            <Route path="privacy" element={<PrivacyCenter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<Admin />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
