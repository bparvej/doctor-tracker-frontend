/**
 * Safe LocalStorage wrapper to prevent SSR and quota errors
 */
export const safeStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`LocalStorage read error for key "${key}":`, e);
      return null;
    }
  },

  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage write error for key "${key}":`, e);
    }
  },

  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`LocalStorage remove error for key "${key}":`, e);
    }
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
  },
};

