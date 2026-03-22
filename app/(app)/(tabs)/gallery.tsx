import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../constants';
import { MediaCard } from '../../../components/media/MediaCard';
import { MediaCardSkeleton } from '../../../components/common/Skeleton';
import { useMediaInfinite, useToggleFavorite } from '../../../hooks/useMedia';
import { UploadModal } from '../../../components/media/UploadModal';
import { MediaViewer } from '../../../components/media/MediaViewer';
import { OfflineBanner } from '../../../components/common/OfflineBanner';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { downloadAndCache } from '../../../services/cacheService';
import type { MediaFile } from '../../../types';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const ITEM_MARGIN = SPACING.sm;
const ITEM_WIDTH = (width - SPACING.lg * 2 - ITEM_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

/**
 * Gallery screen - Displays user's media files in a grid layout.
 * Features:
 * - Infinite scroll pagination
 * - Pull to refresh
 * - Skeleton loading state
 * - Empty state
 * - Error state
 * - Offline support with cached media
 * - Optimized for 100+ items
 */
export default function GalleryScreen() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { data, isLoading, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useMediaInfinite();
  const { toggleFavorite, pendingMediaId } = useToggleFavorite();
  const { isOnline, isLoading: isNetworkLoading } = useNetworkStatus();

  // Flatten all pages into a single array
  const mediaItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Background caching: Download media files for offline viewing
  useEffect(() => {
    if (!isOnline || mediaItems.length === 0) return;

    // Cache all visible items that aren't cached yet
    mediaItems.forEach((media) => {
      if (!media.cached_path) {
        downloadAndCache(
          media._id,
          media.media_type === 'video' ? 'video' : 'image',
          media.file_url
        ).catch(console.warn);
      }
    });
  }, [isOnline, mediaItems.length]);

  // Handle favorite toggle
  const handleFavoritePress = useCallback(
    (media: MediaFile) => {
      toggleFavorite(media._id);
    },
    [toggleFavorite]
  );

  // Handle media press - open full screen viewer
  const handleMediaPress = useCallback((media: MediaFile) => {
    const index = mediaItems.findIndex(m => m._id === media._id);
    setSelectedMediaIndex(index >= 0 ? index : 0);
    setShowMediaViewer(true);
  }, [mediaItems]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Load more on end reached
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: MediaFile) => item._id, []);

  // Render each media item
  const renderItem = useMemo(
    () =>
      ({ item }: { item: MediaFile }) => (
        <View style={[styles.itemWrapper, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
          <MediaCard
            media={item}
            onPress={handleMediaPress}
            onFavoritePress={handleFavoritePress}
            isPending={pendingMediaId === item._id}
          />
        </View>
      ),
    [handleMediaPress, handleFavoritePress, pendingMediaId]
  );

  // Render footer loader for infinite scroll
  const renderFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <View style={[styles.itemWrapper, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
          <MediaCardSkeleton />
        </View>
        <View style={[styles.itemWrapper, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
          <MediaCardSkeleton />
        </View>
        <View style={[styles.itemWrapper, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
          <MediaCardSkeleton />
        </View>
      </View>
    );
  }, [isFetchingNextPage]);

  // Render empty state - only show when NOT loading and NOT error and NO items
  const renderEmpty = useMemo(() => {
    // Don't show empty state when offline with cached data
    if (!isOnline && mediaItems.length > 0) return null;
    if (isError && mediaItems.length === 0) return null;
    // Don't show empty state while initially loading
    if (isPending) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No Media Yet</Text>
        <Text style={styles.emptySubtitle}>
          Your gallery is empty. Start uploading photos and videos!
        </Text>
      </View>
    );
  }, [isError, isPending, isOnline, mediaItems.length]);

  // Render error state - only show when NO cached data available
  const renderError = useMemo(() => {
    if (!isError) return null;
    // Don't show error when we have cached data (offline mode)
    if (mediaItems.length > 0) return null;
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorSubtitle}>Failed to load media</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isError, mediaItems.length, handleRefresh]);

  // Render loading skeleton
  const renderLoading = useMemo(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={index} style={[styles.itemWrapper, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
            <MediaCardSkeleton />
          </View>
        ))}
      </View>
    );
  }, [isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline banner - only show after network check completes and when we have cached data */}
      <OfflineBanner
        visible={!isNetworkLoading && !isOnline && !bannerDismissed && mediaItems.length > 0}
        onDismiss={() => setBannerDismissed(true)}
      />
      {/* Initial loading skeleton - show only on very first load */}
      {isPending ? (
        renderLoading
      ) : (
        <FlatList
          data={mediaItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingNextPage}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={isError ? renderError : null}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
          overScrollMode='never'
        />
      )}
      {/* Upload FAB - only show when online */}
      {isOnline && (
        <>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowUploadModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={32} color={COLORS.textInverse} />
          </TouchableOpacity>
          <UploadModal
            visible={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleRefresh}
          />
        </>
      )}
      <MediaViewer
        visible={showMediaViewer}
        mediaFiles={mediaItems}
        initialIndex={selectedMediaIndex}
        onClose={() => setShowMediaViewer(false)}
      />
    </SafeAreaView>
  );
}

GalleryScreen.displayName = 'GalleryScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  grid: {
    padding: SPACING.lg,
  },
  itemWrapper: {
    margin: ITEM_MARGIN / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerLoader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.5,
  },
  fabTooltip: {
    position: 'absolute',
    bottom: SPACING.xl + 70,
    right: SPACING.lg,
    backgroundColor: COLORS.backgroundTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fabTooltipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
