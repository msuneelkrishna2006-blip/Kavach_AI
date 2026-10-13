import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kavach-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kavach-emerald"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export function RoleGuard({ children, roles }) {
  const { user } = useAuth();
  
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-kavach-text mb-2">Access Denied</h2>
          <p className="text-kavach-text-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return children;
}
