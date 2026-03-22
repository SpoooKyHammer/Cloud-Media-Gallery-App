/**
 * Cache configuration constants for offline media storage.
 */

/**
 * Cache TTL - revalidate after 7 days
 */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Max cache size: 500MB
 */
export const MAX_CACHE_SIZE_BYTES = 500 * 1024 * 1024;

/**
 * Directory name for cached media
 */
export const CACHE_DIR_NAME = 'media-cache';

/**
 * Thumbnail dimensions for cache optimization
 */
export const THUMBNAIL_SIZE = 400;

/**
 * Batch size for cache eviction operations
 */
export const CACHE_EVICTION_BATCH_SIZE = 10;
