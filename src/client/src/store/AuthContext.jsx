import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data || res.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { identifier: email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data || res.data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await api.post('/auth/logout', { refresh_token: localStorage.getItem('refreshToken') }); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
    await loadUser();
  };

  const isAdmin = () => user?.roles?.some(r => r.name === 'admin') || user?.role === 'admin';
  const isManager = () => user?.roles?.some(r => ['admin', 'manager'].includes(r.name)) || ['admin', 'manager'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, isAdmin, isManager, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
