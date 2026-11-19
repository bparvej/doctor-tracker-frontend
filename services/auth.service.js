import { api } from './api';
import { safeStorage } from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

const normalizeUser = (user = {}) => ({
  ...user,
  role: typeof user.role === 'string' ? user.role.toUpperCase() : 'VIEWER',
  isActive: user.isActive !== false,
});

export const authService = {
  /**
   * Log in user with credentials
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response?.data || response;
      const token = data.token;
      const user = normalizeUser(data.user);

      if (!token || !data.user) {
        throw new Error('The login response did not include authentication data.');
      }
      if (!user.isActive) {
        throw new Error('This account has been deactivated.');
      }

      safeStorage.setItem(APP_CONFIG.storageKeys.token, token);
      safeStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(user));
      return { token, user, raw: response };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      await api.post('/auth/logout', {}).catch(() => undefined);
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
    const response = await api.get('/auth/me');
    const data = response?.data || response;
    const user = normalizeUser(data.user || data);

    if (!user.id && !user._id && !user.email) {
      throw new Error('The current-user response did not include user data.');
    }
    if (!user.isActive) {
      safeStorage.removeItem(APP_CONFIG.storageKeys.token);
      safeStorage.removeItem(APP_CONFIG.storageKeys.user);
      throw new Error('This account has been deactivated.');
    }

    safeStorage.setItem(APP_CONFIG.storageKeys.user, JSON.stringify(user));
    return user;
  },

  /**
   * Retrieve cached user details from local storage
   */
  getCachedUser() {
    const userStr = safeStorage.getItem(APP_CONFIG.storageKeys.user);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
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

