import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { initAuthInterceptor } from '../api/client';
import type { User, AuthTokens } from '../types';

// Secure storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
};

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearAuth: () => Promise<void>;
  persistTokens: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => void;
}

/**
 * Auth store for managing authentication state and session persistence.
 * Uses SecureStore for secure token storage on mobile devices.
 * User data is fetched from API, not stored persistently.
 */
export const authStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshTokenValue: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,

  /**
   * Initialize auth state from secure storage on app start.
   * Loads tokens and fetches fresh user data from API.
   */
  initialize: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshTokenValue: refreshToken,
        });

        // Fetch fresh user data from API
        try {
          const user = await authService.getMe();
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          // getMe failed (tokens invalid), clear auth
          console.error('Failed to fetch user data, clearing auth:', error);
          await get().clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
    } finally {
      set({ isInitialized: true });
    }
  },

  /**
   * Login user and persist tokens securely.
   */
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authService.login(email, password);
      await get().persistTokens(response.tokens);
      
      // Set user from response
      get().setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Register new user and persist tokens securely.
   */
  register: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authService.register(name, email, password);
      await get().persistTokens(response.tokens);
      
      // Set user from response
      get().setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Logout user and clear all stored auth data.
   */
  logout: async () => {
    await get().clearAuth();
  },

  /**
   * Refresh access token using refresh token.
   */
  refreshToken: async () => {
    const currentRefreshToken = get().refreshTokenValue;
    
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(currentRefreshToken);
      await get().persistTokens(response.tokens);
    } catch (error) {
      // Refresh failed, clear auth
      await get().clearAuth();
      throw error;
    }
  },

  /**
   * Persist tokens to secure storage.
   */
  persistTokens: async (tokens: AuthTokens) => {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);

    set({
      accessToken: tokens.accessToken,
      refreshTokenValue: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  /**
   * Set user in state.
   */
  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  /**
   * Clear all authentication data from state and storage.
   */
  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);

    set({
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },
}));

// Initialize API interceptor with store methods
initAuthInterceptor(
  () => authStore.getState().accessToken,
  () => authStore.getState().logout(),
  () => authStore.getState().refreshToken()
);
