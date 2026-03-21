import { createVideoPlayer, type VideoThumbnail } from 'expo-video';

interface GetVideoThumbnailOptions {
  time?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Generates a thumbnail from a video URI using expo-video's VideoPlayer.
 * @param videoUri - The video file URI
 * @param options - Thumbnail generation options
 * @returns Promise resolving to VideoThumbnail object or null on failure
 */
export async function getVideoThumbnail(
  videoUri: string,
  options: GetVideoThumbnailOptions = {}
): Promise<VideoThumbnail | null> {
  const { time = 0 } = options;

  try {
    // Create a video player instance
    const player = createVideoPlayer({ uri: videoUri });

    // Generate thumbnail at specified time
    const thumbnails = await player.generateThumbnailsAsync([time], {
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    });

    // Clean up player
    player.release();

    return thumbnails[0] || null;
  } catch (error) {
    console.warn('Failed to generate video thumbnail:', error);
    return null;
  }
}

/**
 * Gets thumbnail source for a video file.
 * For local files, expo-image handles video thumbnails automatically.
 * For remote files (gallery), generates a thumbnail using expo-video's VideoPlayer.
 */
export async function getVideoThumbnailSource(
  videoUri: string
): Promise<string | VideoThumbnail | null> {
  // For local files (upload preview), expo-image handles video thumbnails automatically
  if (videoUri.startsWith('file://')) {
    return videoUri;
  }

  // For remote files (gallery), generate thumbnail using VideoPlayer
  const thumbnail = await getVideoThumbnail(videoUri, { time: 0, maxWidth: 400, maxHeight: 400 });
  return thumbnail;
}
