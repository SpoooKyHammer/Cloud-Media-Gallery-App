import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Network status information.
 */
export interface NetworkStatus {
  /**
   * Whether the device is connected to a network.
   */
  isConnected: boolean;

  /**
   * Whether the internet is reachable (null if unknown).
   */
  isInternetReachable: boolean | null;

  /**
   * Network type (wifi, cellular, etc.).
   */
  type: string | null;
}

/**
 * Hook for monitoring network connectivity status.
 *
 * @example
 * ```typescript
 * const { isOnline, isInternetReachable, checkNetwork } = useNetworkStatus();
 *
 * useEffect(() => {
 *   if (!isOnline) {
 *     // Show offline banner
 *   }
 * }, [isOnline]);
 * ```
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: null,
    type: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Manually check network status.
   */
  const checkNetwork = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    } catch (error) {
      console.warn('Failed to check network status:', error);
      setNetworkStatus({
        isConnected: false,
        isInternetReachable: false,
        type: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkNetwork();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [checkNetwork]);

  return {
    /**
     * Whether the device is connected to a network.
     */
    isConnected: networkStatus.isConnected,

    /**
     * Whether the internet is reachable.
     * True when online, false when offline, null when unknown.
     */
    isInternetReachable: networkStatus.isInternetReachable,

    /**
     * Convenience flag: true when online and internet is reachable.
     */
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable !== false,

    /**
     * Network type (wifi, cellular, etc.).
     */
    type: networkStatus.type,

    /**
     * Whether the initial network check is still loading.
     */
    isLoading,

    /**
     * Manually refresh network status.
     */
    checkNetwork,
  };
}
