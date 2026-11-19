'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { error: toastError, warning: toastWarning } = useToast();

  // Initialize auth from safe storage
  useEffect(() => {
    try {
      const storedToken = safeStorage.getItem(APP_CONFIG.storageKeys.token);
      const storedUser = authService.getCachedUser();

      if (storedToken) {
        setToken(storedToken);
        setUser(storedUser || { role: 'admin' });
      }
    } catch (err) {
      console.error('[AuthProvider] Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for global API events: unauthorized & server health
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const message = e.detail?.message || 'Your session has expired. Please sign in again.';
      toastWarning(message, 'Session Expired');
      setUser(null);
      setToken(null);
      safeStorage.removeItem(APP_CONFIG.storageKeys.token);
      safeStorage.removeItem(APP_CONFIG.storageKeys.user);
      router.push('/login?expired=true');
    };

    const handleApiHealth = (e) => {
      const isOnline = e.detail?.online;
      setBackendOnline(isOnline);
      setBackendStatusReason(e.detail?.reason || '');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('api:health', handleApiHealth);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('api:health', handleApiHealth);
    };
  }, [router, toastWarning]);

  // Login handler
  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      try {
        const result = await authService.login(credentials);
        setToken(result.token);
        setUser(result.user);
        return result;
      } catch (err) {
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout handler
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        backendOnline,
        backendStatusReason,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

