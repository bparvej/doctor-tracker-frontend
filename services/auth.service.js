import { api } from './api';
import { safeStorage } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

export const authService = {
  /**
   * Log in user with credentials
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Fastify backend standard structures
      const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
      const user = response.user || response.data?.user || { email: credentials.email || credentials.username };

      if (token) {
        safeStorage.setItem(APP_CONFIG.storageKeys.token, token);
      }
      if (user) {
        safeStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(user));
      }

      return { token, user, raw: response };
    } catch (error) {
      console.error('[authService.login] Error:', error);
      throw error;
    }
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      await api.post('/auth/logout', {}).catch((err) => {
        console.warn('[authService.logout] Remote logout failed or not supported:', err.message);
      });
    } finally {
      safeStorage.removeItem(APP_CONFIG.storageKeys.token);
      safeStorage.removeItem(APP_CONFIG.storageKeys.user);
      safeStorage.removeItem(APP_CONFIG.storageKeys.redirectUrl);
    }
  },

  /**
   * Fetch current authenticated user profile
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      const user = response.user || response.data?.user || response;
      if (user) {
        safeStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('[authService.getCurrentUser] Error:', error);
      throw error;
    }
  },

  /**
   * Retrieve cached user details from local storage
   */
  getCachedUser() {
    const userStr = safeStorage.getItem(APP_CONFIG.storageKeys.user);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if token is present in storage
   */
  isAuthenticated() {
    return Boolean(safeStorage.getItem(APP_CONFIG.storageKeys.token));
  },
};

