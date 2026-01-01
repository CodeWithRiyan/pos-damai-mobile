import axios, { AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { authStorageAdapter } from '../storage';

// API base URL
const API_BASE_URL = 'https://dev.api.pos.damai.sakaloka.id';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'id',
  },
});

// Request interceptor - add JWT token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorageAdapter.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh and error classification
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStorageAdapter.getRefreshToken();
        if (refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, token: legacyToken } = response.data.data || {};
          const newToken = accessToken || legacyToken || response.data.token;
          
          if (!newToken) throw new Error('Refresh failed');

          authStorageAdapter.setToken(newToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        authStorageAdapter.clearAll();
        // TODO: Navigate to login screen
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Error classification helper
export function isConnectionError(error: unknown): boolean {
  if (isAxiosError(error)) {
    // No response means network/connection error
    if (!error.response) {
      return true;
    }

    // Check for specific network error codes
    const networkErrorCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNABORTED',
      'ENETUNREACH',
      'NETWORK_ERROR',
    ];

    return networkErrorCodes.includes(error.code || '');
  }

  return false;
}

export function isServerError(error: unknown): boolean {
  if (isAxiosError(error)) {
    // Has response means server responded (even with error)
    return !!error.response;
  }

  return false;
}

// Standard API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  errors: string[];
  timestamp: string;
  path: string;
}

// Type-safe error response
export interface ApiErrorResponse {
  message: string;
  errors?: string[] | Record<string, string[]>;
  success?: boolean;
  statusCode?: number;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;
    
    // Prioritize backend message
    if (data?.message) return data.message;
    
    // Fallback to first error in array
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors[0];
    }
    
    // Fallback to record-based errors
    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const messages = (data.errors as Record<string, string[]>)[firstKey];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
    }

    return error.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
