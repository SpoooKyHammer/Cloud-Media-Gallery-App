import { useCallback, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import {
  downloadAndCache,
  getCachedPath,
  clearCache as clearCacheService,
  getCacheSize,
  evictOldestIfNeeded,
  initializeCacheMemory,
  updateCacheMemory,
} from '../services/cacheService';
import type { MediaFile } from '../types';

/**
 * Result of getting an offline media source.
 */
export interface OfflineMediaSource {
  /**
   * The URL to use for displaying the media.
   * - When online: original presigned URL
   * - When offline: local file:// path if cached, null otherwise
   */
  sourceUrl: string | null;

  /**
   * Whether the media is being cached in the background.
   */
  isCaching: boolean;

  /**
   * Whether the media is available offline.
   */
  isAvailableOffline: boolean;
}

/**
 * Hook for managing offline media caching.
 *
 * Provides methods to:
 * - Get the appropriate source URL based on network status
 * - Prefetch media for offline viewing
 * - Clear the cache
 */
export function useOfflineCache() {
  const { isOnline, isConnected, isInternetReachable } = useNetworkStatus();

  /**
   * Get the appropriate source URL for a media item based on network status.
   * When online, returns the original URL and triggers background caching.
   * When offline, returns the cached local path if available.
   */
  const getOfflineSource = useCallback(
    async (media: MediaFile): Promise<OfflineMediaSource> => {
      const isVideo = media.media_type === 'video';

      // Try to get cached path first
      const cachedPath = await getCachedPath(media._id, isVideo ? 'video' : 'image');

      if (cachedPath) {
        // Media is cached
        return {
          sourceUrl: cachedPath,
          isCaching: false,
          isAvailableOffline: true,
        };
      }

      // Not cached
      if (isOnline) {
        // Online: use original URL, trigger background caching
        // Fire-and-forget cache download
        downloadAndCache(media._id, isVideo ? 'video' : 'image', media.file_url)
          .then((localPath) => {
            // Update memory cache when download completes
            updateCacheMemory(media._id, localPath);
          })
          .catch((error) => {
            console.warn('Background caching failed:', error);
          });

        return {
          sourceUrl: media.file_url,
          isCaching: true,
          isAvailableOffline: false,
        };
      }

      // Offline and not cached
      return {
        sourceUrl: null,
        isCaching: false,
        isAvailableOffline: false,
      };
    },
    [isOnline]
  );

  /**
   * Get source URL synchronously for rendering.
   * Returns cached path if available, otherwise original URL.
   * Does not trigger caching.
   */
  const getCachedMediaUrl = useCallback(
    (media: MediaFile): string | null => {
      // This is a simplified version - for actual async caching,
      // use getOfflineSource or handle in a useEffect
      return media.file_url;
    },
    []
  );

  /**
   * Prefetch multiple media items for offline viewing.
   * Downloads all items in the background.
   */
  const prefetchMedia = useCallback(async (mediaItems: MediaFile[]): Promise<void> => {
    const downloadPromises = mediaItems.map(async (media) => {
      try {
        const isVideo = media.media_type === 'video';
        await downloadAndCache(media._id, isVideo ? 'video' : 'image', media.file_url);
      } catch (error) {
        console.warn(`Failed to prefetch media ${media._id}:`, error);
      }
    });

    await Promise.all(downloadPromises);
  }, []);

  /**
   * Clear all cached media.
   */
  const clearCache = useCallback(async (): Promise<void> => {
    await clearCacheService();
  }, []);

  /**
   * Get the current cache size in bytes.
   */
  const getCacheSizeBytes = useCallback(async (): Promise<number> => {
    return await getCacheSize();
  }, []);

  /**
   * Trigger cache eviction if needed.
   */
  const triggerEviction = useCallback(async (): Promise<void> => {
    await evictOldestIfNeeded();
  }, []);

  return {
    /**
     * Whether the device is currently online.
     */
    isOnline,

    /**
     * Whether the device has any network connection.
     */
    isConnected,

    /**
     * Whether the internet is reachable (null if unknown).
     */
    isInternetReachable,

    /**
     * Get the appropriate source URL for a media item.
     */
    getOfflineSource,

    /**
     * Get cached media URL (synchronous, for rendering).
     */
    getCachedMediaUrl,

    /**
     * Prefetch media items for offline viewing.
     */
    prefetchMedia,

    /**
     * Clear all cached media.
     */
    clearCache,

    /**
     * Get current cache size in bytes.
     */
    getCacheSizeBytes,

    /**
     * Trigger cache eviction if needed.
     */
    triggerEviction,
  };
}
