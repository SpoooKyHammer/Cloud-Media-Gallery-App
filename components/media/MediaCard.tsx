import React, { useCallback, memo, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { COLORS, SPACING } from '../../constants';
import type { MediaFile } from '../../types';
import { getVideoThumbnailSource } from '../../utils/getVideoThumbnail';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface MediaCardProps {
  media: MediaFile;
  onPress?: (media: MediaFile) => void;
  onFavoritePress?: (media: MediaFile) => void;
  isFavorite?: boolean;
  isPending?: boolean;
}

/**
 * Media card component displaying a media thumbnail with favorite toggle.
 * Uses memo to prevent unnecessary re-renders.
 * Supports offline viewing with cached media.
 * Uses pre-resolved cached_path from parent for instant rendering.
 */
export const MediaCard = memo(({ media, onPress, onFavoritePress, isFavorite, isPending }: MediaCardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [thumbnailSource, setThumbnailSource] = useState<string | ImageSource | null>(null);
  const { isOnline } = useNetworkStatus();

  const isVideo = media.media_type === 'video';

  // Use cached_path if available, otherwise use remote URL
  // cached_path is pre-populated by the hook for instant rendering
  const sourceUrl = media.cached_path || media.file_url;

  // Generate thumbnail for videos (only for remote URLs)
  useEffect(() => {
    if (!isVideo) {
      setThumbnailSource(sourceUrl);
      return;
    }

    // Local file:// URLs work directly with expo-image - no thumbnail generation needed
    if (sourceUrl.startsWith('file://')) {
      setThumbnailSource(sourceUrl);
      return;
    }

    // Remote URL - generate thumbnail
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        const thumbnail = await getVideoThumbnailSource(sourceUrl);
        if (mounted) {
          setThumbnailSource(thumbnail || sourceUrl);
        }
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
        if (mounted) {
          setThumbnailSource(sourceUrl);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [isVideo, sourceUrl]);

  const handlePress = useCallback(() => {
    onPress?.(media);
  }, [onPress, media]);

  const handleFavoritePress = useCallback(
    (e: any) => {
      e.stopPropagation();
      onFavoritePress?.(media);
    },
    [onFavoritePress, media]
  );

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {isLoading && !hasError && (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        )}
        {thumbnailSource && (
          <Image
            source={typeof thumbnailSource === 'string' ? { uri: thumbnailSource } : thumbnailSource as any}
            style={styles.image}
            contentFit='cover'
            onLoadStart={() => {
              setIsLoading(true);
              setHasError(false);
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            cachePolicy="none"
          />
        )}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Ionicons name="videocam" size={16} color={COLORS.textInverse} />
          </View>
        )}
        {/* Favorite button - hide when offline AND not favorited */}
        {(isOnline || (isFavorite ?? media.is_favorite)) && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
            disabled={!isOnline || isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name={isFavorite ?? media.is_favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ?? media.is_favorite ? COLORS.error : COLORS.textInverse}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

MediaCard.displayName = 'MediaCard';

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundSecondary,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -10,
    zIndex: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: SPACING.xs,
  },
  favoriteButton: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
