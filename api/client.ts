import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_TIMEOUT } from '../constants';
import type { ApiResponse } from '../types';

// Store reference - set via initAuthInterceptor to avoid circular dependency
let getAccessToken: () => string | null = () => null;
let logout: () => Promise<void> = async () => {};
let refreshToken: () => Promise<void> = async () => {};

// Track if refresh is in progress to prevent concurrent refresh attempts
let isRefreshing = false;
// Queue for requests waiting for token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Initialize auth interceptors with store methods.
 * Call this after authStore is created to avoid circular dependency.
 */
export const initAuthInterceptor = (
  getToken: () => string | null,
  doLogout: () => Promise<void>,
  doRefreshToken: () => Promise<void>
) => {
  getAccessToken = getToken;
  logout = doLogout;
  refreshToken = doRefreshToken;
};

/**
 * Creates and configures the API client instance with interceptors
 * for authentication and error handling.
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token to requests
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - Handle 401 errors and auto-refresh token
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig;

      if (error.response?.status === 401) {
        // If this is the refresh token request itself, don't try to refresh
        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
        if (isRefreshRequest) {
          // Refresh token is invalid/expired, logout user
          await logout();
          return Promise.reject(error);
        }

        // If refresh is already in progress, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(client(originalRequest));
              },
              reject,
            });
          });
        }

        isRefreshing = true;

        try {
          // Attempt to refresh the token
          await refreshToken();

          // Get new token
          const newToken = getAccessToken();
          if (!newToken) {
            throw new Error('Failed to get new access token');
          }

          // Process queued requests
          processQueue(null, newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed (refresh token invalid/expired), logout user
          processQueue(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'));
          await logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
