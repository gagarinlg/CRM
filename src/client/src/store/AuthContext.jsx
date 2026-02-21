import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

/** Read cached user synchronously so the first render already has role info. */
function readCachedUser() {
  try { return JSON.parse(localStorage.getItem('_crm_user')) || null; } catch { return null; }
}

export const AuthProvider = ({ children }) => {
  // Initialise from cache so isAdminUser is correct on the very first render.
  // This prevents the false→true transition that causes Firefox's compositor
  // to miss the repaint of the permanent Drawer's children.
  const [user, setUserState] = useState(readCachedUser);
  const [loading, setLoading] = useState(true);

  /** Persist user in localStorage so subsequent renders start correctly. */
  const setUser = useCallback((u) => {
    if (u) { try { localStorage.setItem('_crm_user', JSON.stringify(u)); } catch { /* quota */ } }
    else { localStorage.removeItem('_crm_user'); }
    setUserState(u);
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data || res.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => { loadUser(); }, [loadUser]);

  /**
   * Step 1 of login. Returns:
   *  - { mustChangePassword: true }           → redirect to /change-password
   *  - { requiresTotp: true, preAuthToken }   → show TOTP screen
   *  - user object                            → fully logged in
   */
  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const data = res.data.data || res.data;

    if (data.requires_totp) {
      // Return sentinel so Login page can render the TOTP step
      return { requiresTotp: true, preAuthToken: data.pre_auth_token, user: data.user };
    }

    const { access_token: accessToken, refresh_token: refreshToken, user: userData } = data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return userData;
  };

  /**
   * Step 2 of login when TOTP is required.
   */
  const verifyTotp = async (preAuthToken, totpToken) => {
    const res = await api.post('/auth/2fa/verify', { pre_auth_token: preAuthToken, totp_token: totpToken });
    const data = res.data.data || res.data;
    const { access_token: accessToken, refresh_token: refreshToken, user: userData } = data;
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

  const isAdmin = () => user?.roles?.some(r => (r.name || r).toLowerCase() === 'admin');
  const isManager = () => user?.roles?.some(r => ['admin', 'manager'].includes((r.name || r).toLowerCase()));
  // Pre-computed booleans — reactive to user state changes; more reliable than calling
  // the functions in render because React tracks state reads for re-render scheduling.
  const isAdminUser = Boolean(user?.roles?.some(r => (r.name || r).toLowerCase() === 'admin'));
  const isManagerUser = Boolean(user?.roles?.some(r => ['admin', 'manager'].includes((r.name || r).toLowerCase())));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyTotp, changePassword, isAdmin, isManager, isAdminUser, isManagerUser, loadUser }}>
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
