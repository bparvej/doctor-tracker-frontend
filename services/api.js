import { APP_CONFIG } from '../constants/config';
import { safeStorage } from '../utils/storage';

/**
 * Custom API Error class with enriched diagnostic info
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = data?.error?.code || null;
    this.requestId = data?.requestId || null;
    this.success = data?.success ?? false;
    this.isNetworkError = isNetworkError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Centralized API client for communicating with the Fastify backend
 */
class ApiClient {
  constructor() {
    this.baseUrl = (APP_CONFIG.apiUrl || 'https://doctor-tracker-backend-gfj8.onrender.com/api').replace(/\/+$/, '');
    this.defaultTimeout = APP_CONFIG.apiTimeout;
  }

  /**
   * Get authentication headers
   */
  getHeaders(customHeaders = {}, isFormData = false) {
    const headers = { ...customHeaders };
    
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Attach Bearer token if available
    const token = safeStorage.getItem(APP_CONFIG.storageKeys.token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Unified request handler with timeout and error resilience
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      params = null,
      headers = {},
      timeout = this.defaultTimeout,
      ...customOptions
    } = options;

    // Ensure baseUrl is current
    const currentBaseUrl = (process.env.NEXT_PUBLIC_API_URL || APP_CONFIG.apiUrl || 'https://doctor-tracker-backend-gfj8.onrender.com/api').replace(/\/+$/, '');

    // Build URL with query params
    let url = `${currentBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Configure AbortController for request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const requestHeaders = this.getHeaders(headers, isFormData);

    const fetchConfig = {
      method,
      headers: requestHeaders,
      credentials: 'include', // Support HttpOnly cookies if configured
      signal: controller.signal,
      ...customOptions,
    };

    if (body) {
      fetchConfig.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      // Parse response payload safely
      let responseData = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (jsonErr) {
          console.warn('[ApiClient] Failed to parse JSON response:', jsonErr);
        }
      } else {
        responseData = await response.text();
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        const unauthMsg =
          responseData?.error?.message ||
          responseData?.message ||
          'Session expired. Please log in again to continue.';

        console.warn('[ApiClient] Session expired or unauthorized (401) at', endpoint);
        safeStorage.removeItem(APP_CONFIG.storageKeys.token);
        safeStorage.removeItem(APP_CONFIG.storageKeys.user);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', {
            detail: { message: unauthMsg }
          }));
        }

        throw new ApiError(unauthMsg, 401, responseData);
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorMessage =
          responseData?.error?.message ||
          responseData?.message ||
          (typeof responseData?.error === 'string' ? responseData.error : null) ||
          `Request failed with status ${response.status} (${response.statusText})`;

        console.error(`[ApiClient Error] ${method} ${url} [${response.status}]:`, responseData || errorMessage);

        throw new ApiError(errorMessage, response.status, responseData);
      }

      // Notify successful backend connection
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:health', { detail: { online: true } }));
      }

      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      // Handle Abort / Timeout
      if (error.name === 'AbortError') {
        const timeoutMsg = `Request timed out after ${timeout / 1000} seconds. The backend server might be unresponsive.`;
        console.error(`[ApiClient Timeout] ${method} ${url}:`, timeoutMsg);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:health', { detail: { online: false, reason: 'timeout' } }));
        }
        
        throw new ApiError(timeoutMsg, 408, null, true);
      }

      // Handle Network failures (backend down, connection refused, DNS failure)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const downMsg = `Unable to reach the backend server at ${currentBaseUrl}. Please verify the Fastify API is online.`;
        console.error(`[ApiClient Server Down] ${method} ${url}:`, error);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:health', { detail: { online: false, reason: 'offline' } }));
        }

        throw new ApiError(downMsg, 0, null, true);
      }

      // Already an ApiError instance
      if (error instanceof ApiError) {
        throw error;
      }

      // Generic unknown error
      console.error(`[ApiClient Unexpected Error] ${method} ${url}:`, error);
      throw new ApiError(error.message || 'An unexpected error occurred.', 500, null);
    }
  }

  get(endpoint, params = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  }

  post(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
