import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { initAuthInterceptor } from '../api/client';
import { clearCache, clearCacheMemory } from '../services/cacheService';
import { clearQueryCache } from '../components/common/QueryProvider';
import type { User, AuthTokens } from '../types';
import NetInfo from '@react-native-community/netinfo';

// Secure storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
};

/**
 * Check if error is a network error (not an auth error).
 */
function isNetworkError(error: unknown): boolean {
  // Check for network-related error messages
  const errorMessage = (error as Error)?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('failed to fetch')
  );
}

/**
 * Check if device is currently online.
 */
async function checkOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

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
  persistUserData: (user: User) => Promise<void>;
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
   * Loads tokens and user data from secure storage.
   * When offline, keeps auth state with tokens but marks user as offline.
   */
  initialize: async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshTokenValue: refreshToken,
        });

        // Load user data from secure storage if available
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData) as User;
            set({
              user: parsedUser,
              isAuthenticated: true,
            });
            console.log('Loaded user data from secure storage');
          } catch (error) {
            console.warn('Failed to parse stored user data:', error);
          }
        }

        // Check if online before fetching user data
        const isOnline = await checkOnline();

        if (isOnline) {
          // Fetch fresh user data from API
          try {
            const user = await authService.getMe();
            set({
              user,
              isAuthenticated: true,
            });
            // Update stored user data
            await get().persistUserData(user);
          } catch (error) {
            // Only clear auth if it's an actual auth error (401), not network error
            if (!isNetworkError(error)) {
              console.error('Auth tokens invalid, clearing auth:', error);
              await get().clearAuth();
            } else {
              // Network error - keep auth state, user can access cached data
              console.warn('Network error during auth init, keeping cached auth state');
              set({
                isAuthenticated: true,
              });
            }
          }
        } else {
          // Offline - keep auth state with tokens, user can access cached data
          console.log('Offline during auth init, keeping cached auth state');
          set({
            isAuthenticated: true,
          });
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
   * Persist user data to secure storage.
   */
  persistUserData: async (user: User) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to persist user data:', error);
    }
  },

  /**
   * Set user in state and persist to secure storage.
   */
  setUser: (user: User) => {
    get().persistUserData(user);
    set({ user, isAuthenticated: true });
  },

  /**
   * Clear all authentication data from state and storage.
   */
  clearAuth: async () => {
    // Clear auth tokens and user data from secure storage
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
    ]);

    // Clear all caches
    await clearCache();        // Clear media file cache
    clearCacheMemory();        // Clear in-memory cache map
    await clearQueryCache();   // Clear React Query cache (NEW!)

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
