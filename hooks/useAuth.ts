import { authStore } from '../store/authStore';

/**
 * Hook for accessing authentication state and actions.
 */
export const useAuth = () => {
  const {
    user,
    accessToken,
    refreshTokenValue,
    isAuthenticated,
    isLoading,
  } = authStore();

  const login = authStore((state) => state.login);
  const register = authStore((state) => state.register);
  const logout = authStore((state) => state.logout);

  return {
    user,
    accessToken,
    refreshToken: refreshTokenValue,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
};

/**
 * Hook for session management (initialize, check auth).
 */
export const useSession = () => {
  const initialize = authStore((state) => state.initialize);
  const isInitialized = authStore((state) => state.isInitialized);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  return {
    initialize,
    isInitialized,
    isAuthenticated,
  };
};

/**
 * Hook for login functionality with form handling.
 */
export const useLogin = () => {
  const login = authStore((state) => state.login);
  const isLoading = authStore((state) => state.isLoading);

  return {
    login,
    isLoading,
  };
};

/**
 * Hook for registration functionality with form handling.
 */
export const useRegister = () => {
  const register = authStore((state) => state.register);
  const isLoading = authStore((state) => state.isLoading);

  return {
    register,
    isLoading,
  };
};
