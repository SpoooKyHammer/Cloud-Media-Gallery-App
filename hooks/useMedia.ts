import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { mediaService } from '../services/mediaService';
import { populateCachedPaths } from '../services/cacheService';
import type { MediaFile, PaginatedResponse } from '../types';
import type { ImagePickerAsset } from 'expo-image-picker';

const PAGE_SIZE = 12;

export interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

/**
 * Check if device is currently online.
 */
async function checkOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

/**
 * Hook for fetching media with infinite scroll pagination.
 * When offline, uses cached data only without attempting to refetch.
 * Automatically populates cached_path on media items for offline support.
 */
export const useMediaInfinite = () => {
  return useInfiniteQuery<
    PaginatedResponse<MediaFile>,
    Error,
    InfiniteData<PaginatedResponse<MediaFile>, number>,
    Array<string>,
    number
  >({
    queryKey: ['media'],
    queryFn: async ({ pageParam = 1 }) => {
      const isOnline = await checkOnline();
      if (!isOnline) {
        throw new Error('Network error: Device is offline');
      }
      return await mediaService.getMedia({ page: pageParam, limit: PAGE_SIZE });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    // Don't retry when offline
    retry: (failureCount, error) => {
      if (error.message?.includes('offline') || error.message?.includes('Network')) {
        return false;
      }
      return failureCount < 2;
    },
    // Populate cached_path on media items for fast offline access
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: populateCachedPaths(page.data),
      })),
    }),
  });
};

/**
 * Hook for fetching favorites with infinite scroll pagination.
 * When offline, uses cached data only without attempting to refetch.
 * Automatically populates cached_path on media items for offline support.
 */
export const useFavoritesInfinite = () => {
  return useInfiniteQuery<
    PaginatedResponse<MediaFile>,
    Error,
    InfiniteData<PaginatedResponse<MediaFile>, number>,
    Array<string>,
    number
  >({
    queryKey: ['favorites'],
    queryFn: async ({ pageParam = 1 }) => {
      const isOnline = await checkOnline();
      if (!isOnline) {
        throw new Error('Network error: Device is offline');
      }
      return await mediaService.getFavorites({ page: pageParam, limit: PAGE_SIZE });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    // Don't retry when offline
    retry: (failureCount, error) => {
      if (error.message?.includes('offline') || error.message?.includes('Network')) {
        return false;
      }
      return failureCount < 2;
    },
    // Populate cached_path on media items for fast offline access
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: populateCachedPaths(page.data),
      })),
    }),
  });
};

export interface UseUploadMediaOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (data: MediaFile[]) => void;
  onError?: (error: Error) => void;
}

export interface UploadMutationVars {
  assets: ImagePickerAsset[];
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Hook for uploading media with progress tracking.
 */
export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assets, onProgress }: UploadMutationVars) => {
      return await mediaService.uploadMedia(assets, onProgress);
    },
    onSuccess: (uploadedMedia) => {
      // Update the media query cache with newly uploaded media
      // This avoids a full refetch and provides instant UI update
      queryClient.setQueryData(['media'], (oldData: InfiniteData<PaginatedResponse<MediaFile>, number> | undefined) => {
        if (!oldData) return oldData;

        // Add uploaded media to the first page
        const updatedPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            // Prepend new media to first page (newest first)
            return {
              ...page,
              data: [...uploadedMedia, ...page.data],
              pagination: {
                ...page.pagination,
                total: page.pagination.total + uploadedMedia.length,
              },
            };
          }
          return page;
        });

        return {
          ...oldData,
          pages: updatedPages,
        };
      });
    },
  });
};

/**
 * Hook for toggling favorite status.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      return await mediaService.toggleFavorite(mediaId);
    },
    onSuccess: (updatedMedia) => {
      // Update both media and favorites queries
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

/**
 * Hook for deleting media.
 */
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      return await mediaService.deleteMedia(mediaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
