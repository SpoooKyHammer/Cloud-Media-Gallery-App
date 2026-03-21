import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { mediaService } from '../services/mediaService';
import type { MediaFile, PaginatedResponse } from '../types';
import type { ImagePickerAsset } from 'expo-image-picker';

const PAGE_SIZE = 12;

export interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

/**
 * Hook for fetching media with infinite scroll pagination.
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
      return await mediaService.getMedia({ page: pageParam, limit: PAGE_SIZE });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
};

/**
 * Hook for fetching favorites with infinite scroll pagination.
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
      return await mediaService.getFavorites({ page: pageParam, limit: PAGE_SIZE });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
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
