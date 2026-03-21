import React, { useCallback, memo } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';
import type { MediaFile } from '../../types';

export interface MediaCardProps {
  media: MediaFile;
  onPress?: (media: MediaFile) => void;
  onFavoritePress?: (media: MediaFile) => void;
  isFavorite?: boolean;
}

/**
 * Media card component displaying a media thumbnail with favorite toggle.
 * Uses memo to prevent unnecessary re-renders.
 */
export const MediaCard = memo(({ media, onPress, onFavoritePress, isFavorite }: MediaCardProps) => {
  const [isLoading, setIsLoading] = React.useState(true);

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

  const isVideo = media.media_type === 'video';

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {isLoading && <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />}
        <Image
          source={{ uri: media.thumbnail_url || media.file_url }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Ionicons name="videocam" size={16} color={COLORS.textInverse} />
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress} activeOpacity={0.7}>
          <Ionicons
            name={isFavorite ?? media.is_favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ?? media.is_favorite ? COLORS.error : COLORS.textInverse}
          />
        </TouchableOpacity>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
