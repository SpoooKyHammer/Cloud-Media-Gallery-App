import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_TIMEOUT } from '../constants';
import type { ApiResponse } from '../types';

// Store reference - set via initAuthInterceptor to avoid circular dependency
let getAccessToken: () => string | null = () => null;
let logout: () => Promise<void> = async () => {};
let refreshToken: () => Promise<void> = async () => {};

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
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (originalRequest._retry) {
          // Already retried, prevent infinite loop
          await logout();
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          await refreshToken();
          
          // Retry the original request with new token
          const newToken = getAccessToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          await logout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
