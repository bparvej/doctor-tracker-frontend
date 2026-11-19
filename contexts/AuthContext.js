'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { safeStorage } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [backendStatusReason, setBackendStatusReason] = useState('');
  const router = useRouter();
  const { warning: toastWarning } = useToast();

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    safeStorage.removeItem(APP_CONFIG.storageKeys.token);
    safeStorage.removeItem(APP_CONFIG.storageKeys.user);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const storedToken = safeStorage.getItem(APP_CONFIG.storageKeys.token);
      const cachedUser = authService.getCachedUser();
      if (!storedToken) {
        clearSession();
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      setUser(cachedUser ? { ...cachedUser, role: String(cachedUser.role || 'VIEWER').toUpperCase(), isActive: cachedUser.isActive !== false } : null);
      try {
        const currentUser = await authService.getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch (error) {
        if (!cancelled) {
          clearSession();
          if (error.status !== 401) {
            router.replace(`/login?expired=true&reason=${encodeURIComponent(error.message || 'Session unavailable')}`);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, [clearSession, router]);

  useEffect(() => {
    const handleUnauthorized = (e) => {
      clearSession();
      toastWarning(e.detail?.message || 'Your session has expired. Please sign in again.', 'Session Expired');
      router.replace('/login?expired=true');
    };
    const handleApiHealth = (e) => {
      setBackendOnline(e.detail?.online);
      setBackendStatusReason(e.detail?.reason || '');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('api:health', handleApiHealth);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('api:health', handleApiHealth);
    };
  }, [clearSession, router, toastWarning]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setToken(result.token);
      setUser(result.user);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      clearSession();
      setIsLoading(false);
      router.replace('/login');
    }
  }, [clearSession, router]);

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ADMIN',
      isViewer: user?.role === 'VIEWER',
      isLoading,
      backendOnline,
      backendStatusReason,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

