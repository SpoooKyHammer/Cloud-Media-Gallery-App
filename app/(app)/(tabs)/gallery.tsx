import React, { useCallback, useMemo, useState } from 'react';
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
import type { MediaFile, PaginatedResponse } from '../../../types';
import type { InfiniteData } from '@tanstack/react-query';

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
 * - Optimized for 100+ items
 */
export default function GalleryScreen() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useMediaInfinite();
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Flatten all pages into a single array
  const mediaItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Handle favorite toggle
  const handleFavoritePress = useCallback(
    (media: MediaFile) => {
      toggleFavorite(media._id);
    },
    [toggleFavorite]
  );

  // Handle media press (placeholder for navigation)
  const handleMediaPress = useCallback((media: MediaFile) => {
    // TODO: Navigate to media detail screen
    console.log('Pressed media:', media._id);
  }, []);

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
          />
        </View>
      ),
    [handleMediaPress, handleFavoritePress]
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

  // Render empty state
  const renderEmpty = useMemo(() => {
    if (isLoading) return null;
    if (isError) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No Media Yet</Text>
        <Text style={styles.emptySubtitle}>
          Your gallery is empty. Start uploading photos and videos!
        </Text>
      </View>
    );
  }, [isLoading, isError]);

  // Render error state
  const renderError = useMemo(() => {
    if (!isError) return null;
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
  }, [isError, handleRefresh]);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => setShowUploadModal(true)}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
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
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
      />
      {renderLoading}
      {renderError}
      <UploadModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  uploadButton: {
    padding: SPACING.xs,
  },
  grid: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
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
    backgroundColor: COLORS.backgroundSecondary,
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
});
