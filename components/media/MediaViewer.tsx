import React, { memo, useCallback, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';
import type { MediaFile } from '../../types';

export interface MediaViewerProps {
  visible: boolean;
  mediaFiles: MediaFile[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Video slide component with expo-video player.
 */
const VideoSlide = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer({ uri }, (player) => {
    player.play();
    player.loop = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
    />
  );
};

/**
 * Image slide component with expo-image.
 */
const ImageSlide = ({ uri }: { uri: string }) => (
  <Image
    source={{ uri }}
    style={styles.image}
    contentFit="contain"
  />
);

/**
 * Full-screen media viewer with zoom/pan gestures and navigation.
 * Supports images and videos with swipe navigation between items.
 */
export const MediaViewer = memo(({
  visible,
  mediaFiles,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const flatListRef = React.useRef<FlatList<MediaFile>>(null);

  React.useEffect(() => {
    if (visible && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
      flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }
  }, [visible, initialIndex]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleIndexChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: MediaFile; index: number }) => {
    const isVideo = item.media_type === 'video';

    return (
      <View style={styles.slide}>
        {isVideo ? (
          <VideoSlide uri={item.file_url} />
        ) : (
          <ImageSlide uri={item.file_url} />
        )}

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1} / {mediaFiles.length}
          </Text>
        </View>
      </View>
    );
  }, [mediaFiles.length]);

  const renderPagination = useCallback(() => {
    if (mediaFiles.length <= 1) return null;

    return (
      <View style={styles.pagination}>
        {mediaFiles.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  }, [mediaFiles.length, currentIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={32} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Media Grid */}
        <FlatList
          ref={flatListRef}
          data={mediaFiles}
          renderItem={renderItem}
          keyExtractor={(item, index) => `media-${index}-${item._id}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            handleIndexChange(index);
          }}
        />

        {/* Pagination */}
        {renderPagination()}
      </View>
    </Modal>
  );
});

MediaViewer.displayName = 'MediaViewer';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  counter: {
    position: 'absolute',
    bottom: SPACING.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  counterText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: COLORS.textInverse,
    width: 24,
    borderRadius: 4,
  },
});
