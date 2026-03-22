import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_TTL_MS,
  MAX_CACHE_SIZE_BYTES,
  CACHE_DIR_NAME,
  CACHE_EVICTION_BATCH_SIZE,
} from '../constants/cache';

/**
 * Metadata for a cached media item.
 */
export interface CachedMediaMetadata {
  mediaId: string;
  mediaType: 'image' | 'video';
  localPath: string;
  originalUrl: string;
  cachedAt: number;
  sizeBytes: number;
  lastAccessedAt: number;
}

/**
 * Cache metadata storage key prefix.
 */
const CACHE_METADATA_PREFIX = 'cache:';

/**
 * Cache index key for tracking all cached items.
 */
const CACHE_INDEX_KEY = 'cache:index';

/**
 * Get the cache directory path.
 */
async function getCacheDirectory(): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory not available');
  }

  const cacheDir = `${FileSystem.documentDirectory}${CACHE_DIR_NAME}`;

  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }

  return cacheDir;
}

/**
 * Get the local file path for a cached media item.
 */
function getLocalCachePath(mediaId: string, mediaType: 'image' | 'video'): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document directory not available');
  }

  const extension = mediaType === 'video' ? 'mp4' : 'jpg';
  return `${FileSystem.documentDirectory}${CACHE_DIR_NAME}/${mediaId}.${extension}`;
}

/**
 * Get metadata storage key for a media item.
 */
function getMetadataKey(mediaId: string): string {
  return `${CACHE_METADATA_PREFIX}${mediaId}`;
}

/**
 * Get the cache index from storage.
 */
async function getCacheIndex(): Promise<string[]> {
  try {
    const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!indexJson) {
      return [];
    }
    return JSON.parse(indexJson);
  } catch (error) {
    console.warn('Failed to read cache index:', error);
    return [];
  }
}

/**
 * Update the cache index.
 */
async function updateCacheIndex(index: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.warn('Failed to update cache index:', error);
  }
}

/**
 * Get metadata for a cached media item.
 */
async function getMetadata(mediaId: string): Promise<CachedMediaMetadata | null> {
  try {
    const metadataJson = await AsyncStorage.getItem(getMetadataKey(mediaId));
    if (!metadataJson) {
      return null;
    }
    return JSON.parse(metadataJson);
  } catch (error) {
    console.warn('Failed to read cache metadata:', error);
    return null;
  }
}

/**
 * Save metadata for a cached media item.
 */
async function saveMetadata(metadata: CachedMediaMetadata): Promise<void> {
  try {
    await AsyncStorage.setItem(getMetadataKey(metadata.mediaId), JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to save cache metadata:', error);
  }
}

/**
 * Remove metadata for a cached media item.
 */
async function removeMetadata(mediaId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(getMetadataKey(mediaId));
  } catch (error) {
    console.warn('Failed to remove cache metadata:', error);
  }
}

/**
 * Calculate total cache size.
 */
export async function getCacheSize(): Promise<number> {
  try {
    const index = await getCacheIndex();
    let totalSize = 0;

    for (const mediaId of index) {
      const metadata = await getMetadata(mediaId);
      if (metadata?.sizeBytes) {
        totalSize += metadata.sizeBytes;
      }
    }

    return totalSize;
  } catch (error) {
    console.warn('Failed to calculate cache size:', error);
    return 0;
  }
}

/**
 * Evict oldest cached items to free up space.
 */
export async function evictOldestIfNeeded(targetFreeBytes: number = 0): Promise<void> {
  try {
    const index = await getCacheIndex();
    if (index.length === 0) {
      return;
    }

    // Get metadata for all cached items
    const itemsWithMetadata: Array<{ mediaId: string; metadata: CachedMediaMetadata }> = [];

    for (const mediaId of index) {
      const metadata = await getMetadata(mediaId);
      if (metadata) {
        itemsWithMetadata.push({ mediaId, metadata });
      }
    }

    // Sort by lastAccessedAt (oldest first)
    itemsWithMetadata.sort((a, b) => a.metadata.lastAccessedAt - b.metadata.lastAccessedAt);

    // Calculate current cache size
    let currentSize = itemsWithMetadata.reduce(
      (sum, item) => sum + item.metadata.sizeBytes,
      0
    );

    const targetSize = MAX_CACHE_SIZE_BYTES - targetFreeBytes;

    // Evict oldest items until we're under the limit
    const evictedIds: string[] = [];

    for (const { mediaId, metadata } of itemsWithMetadata) {
      if (currentSize <= targetSize) {
        break;
      }

      await removeCachedItem(mediaId);
      evictedIds.push(mediaId);
      currentSize -= metadata.sizeBytes;
    }

    if (evictedIds.length > 0) {
      console.log(`Evicted ${evictedIds.length} cached items to free up space`);
    }
  } catch (error) {
    console.warn('Failed to evict oldest cache items:', error);
  }
}

/**
 * Remove a single cached item from storage.
 */
async function removeCachedItem(mediaId: string): Promise<void> {
  try {
    const metadata = await getMetadata(mediaId);
    if (metadata?.localPath) {
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(metadata.localPath, { idempotent: true });
      }
    }

    await removeMetadata(mediaId);

    // Update index
    const index = await getCacheIndex();
    const updatedIndex = index.filter((id) => id !== mediaId);
    await updateCacheIndex(updatedIndex);
  } catch (error) {
    console.warn('Failed to remove cached item:', error);
  }
}

/**
 * Download and cache a media file.
 */
export async function downloadAndCache(
  mediaId: string,
  mediaType: 'image' | 'video',
  url: string
): Promise<string> {
  try {
    // Check if already cached and not expired
    const existingMetadata = await getMetadata(mediaId);
    if (existingMetadata) {
      const fileInfo = await FileSystem.getInfoAsync(existingMetadata.localPath);
      if (fileInfo.exists) {
        // Update last accessed time
        const updatedMetadata: CachedMediaMetadata = {
          ...existingMetadata,
          lastAccessedAt: Date.now(),
        };
        await saveMetadata(updatedMetadata);
        return existingMetadata.localPath;
      }
    }

    // Get cache directory
    const cacheDir = await getCacheDirectory();

    // Generate local file path
    const localPath = getLocalCachePath(mediaId, mediaType);

    // Check if we need to evict items before downloading
    const currentSize = await getCacheSize();
    if (currentSize >= MAX_CACHE_SIZE_BYTES) {
      await evictOldestIfNeeded();
    }

    // Download file
    const downloadResult = await FileSystem.downloadAsync(url, localPath);

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    const sizeBytes = (fileInfo as any).size || 0;

    // Create metadata
    const metadata: CachedMediaMetadata = {
      mediaId,
      mediaType,
      localPath,
      originalUrl: url,
      cachedAt: Date.now(),
      sizeBytes,
      lastAccessedAt: Date.now(),
    };

    // Save metadata
    await saveMetadata(metadata);

    // Update index
    const index = await getCacheIndex();
    if (!index.includes(mediaId)) {
      index.push(mediaId);
      await updateCacheIndex(index);
    }

    // Update memory cache for fast sync lookups
    updateCacheMemory(mediaId, localPath);

    return localPath;
  } catch (error) {
    console.warn('Failed to download and cache media:', error);
    throw error;
  }
}

/**
 * Get the cached path for a media item if it exists and is valid.
 */
export async function getCachedPath(
  mediaId: string,
  mediaType: 'image' | 'video'
): Promise<string | null> {
  try {
    const metadata = await getMetadata(mediaId);
    if (!metadata) {
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - metadata.cachedAt;
    if (age > CACHE_TTL_MS) {
      // Cache expired, remove and return null
      await removeCachedItem(mediaId);
      return null;
    }

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
    if (!fileInfo.exists) {
      // File missing, clean up metadata
      await removeCachedItem(mediaId);
      return null;
    }

    // Update last accessed time
    const updatedMetadata: CachedMediaMetadata = {
      ...metadata,
      lastAccessedAt: Date.now(),
    };
    await saveMetadata(updatedMetadata);

    return metadata.localPath;
  } catch (error) {
    console.warn('Failed to get cached path:', error);
    return null;
  }
}

/**
 * Remove a cached media item.
 */
export async function removeCache(mediaId: string): Promise<void> {
  await removeCachedItem(mediaId);
}

/**
 * Clear all cached media.
 */
export async function clearCache(): Promise<void> {
  try {
    const index = await getCacheIndex();

    // Delete all cached files
    for (const mediaId of index) {
      await removeCachedItem(mediaId);
    }

    // Clear index
    await updateCacheIndex([]);

    console.log('Cache cleared successfully');
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Get all cached media metadata.
 */
export async function getAllCachedMetadata(): Promise<CachedMediaMetadata[]> {
  try {
    const index = await getCacheIndex();
    const metadataList: CachedMediaMetadata[] = [];

    for (const mediaId of index) {
      const metadata = await getMetadata(mediaId);
      if (metadata) {
        metadataList.push(metadata);
      }
    }

    return metadataList;
  } catch (error) {
    console.warn('Failed to get all cached metadata:', error);
    return [];
  }
}

/**
 * Check if a media item is cached.
 */
export async function isCached(mediaId: string): Promise<boolean> {
  const cachedPath = await getCachedPath(mediaId, 'image');
  if (cachedPath) {
    return true;
  }

  const videoPath = await getCachedPath(mediaId, 'video');
  return videoPath !== null;
}

/**
 * In-memory cache map for fast sync lookups.
 * Populated on app start and updated when files are cached.
 */
let cacheMemoryMap: Map<string, string> = new Map();

/**
 * Initialize the in-memory cache map from AsyncStorage.
 * Call this on app start for fast sync lookups.
 */
export async function initializeCacheMemory(): Promise<void> {
  try {
    const index = await getCacheIndex();
    cacheMemoryMap.clear();

    for (const mediaId of index) {
      const metadata = await getMetadata(mediaId);
      if (metadata?.localPath) {
        cacheMemoryMap.set(mediaId, metadata.localPath);
      }
    }

    console.log(`Cache memory initialized with ${cacheMemoryMap.size} items`);
  } catch (error) {
    console.warn('Failed to initialize cache memory:', error);
  }
}

/**
 * Get cached path synchronously from memory.
 * Returns null if not cached or cache not initialized.
 */
export function getCachedPathSync(mediaId: string): string | null {
  return cacheMemoryMap.get(mediaId) || null;
}

/**
 * Populate cached_path on MediaFile objects from memory cache.
 * Returns new array with cached_path populated where available.
 */
export function populateCachedPaths<T extends { _id: string; cached_path?: string }>(
  items: T[]
): T[] {
  return items.map((item) => ({
    ...item,
    cached_path: getCachedPathSync(item._id) || undefined,
  }));
}

/**
 * Update memory cache when a file is cached.
 */
export function updateCacheMemory(mediaId: string, localPath: string): void {
  cacheMemoryMap.set(mediaId, localPath);
}

/**
 * Remove from memory cache when a file is uncached.
 */
export function removeFromCacheMemory(mediaId: string): void {
  cacheMemoryMap.delete(mediaId);
}

/**
 * Clear memory cache.
 */
export function clearCacheMemory(): void {
  cacheMemoryMap.clear();
}
