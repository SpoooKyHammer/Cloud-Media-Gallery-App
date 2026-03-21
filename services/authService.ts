import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse, AuthResponse, LoginInput, RegisterInput } from '../types';

/**
 * Authentication service for handling API communication.
 */
export const authService = {
  /**
   * Register a new user.
   */
  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const payload: RegisterInput = { name, email, password };
    
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }

    return response.data.data;
  },

  /**
   * Login user with email and password.
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const payload: LoginInput = { email, password };

    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }

    return response.data.data;
  },

  /**
   * Refresh access token using refresh token.
   */
  refreshToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await apiClient.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Token refresh failed');
    }

    return response.data.data;
  },

  /**
   * Get current user profile.
   */
  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<ApiResponse<AuthResponse['user']>>(
      API_ENDPOINTS.AUTH.ME
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch user');
    }

    return response.data.data;
  },
};
