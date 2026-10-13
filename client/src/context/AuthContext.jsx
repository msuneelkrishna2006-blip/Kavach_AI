import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('kavach_token'));
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((newToken, userData) => {
    sessionStorage.setItem('kavach_token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('kavach_token');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    saveAuth(data.data.token, data.data.user);
    return data.data;
  }, [saveAuth]);

  const register = useCallback(async (email, password, fullName) => {
    const { data } = await authApi.register({ email, password, fullName });
    saveAuth(data.data.token, data.data.user);
    return data.data;
  }, [saveAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      setUser(data.data);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
