import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { mediaService } from '../services/mediaService';
import type { MediaFile, PaginatedResponse } from '../types';

const PAGE_SIZE = 12;

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
