import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse, MediaFile, PaginatedResponse } from '../types';

export interface GetMediaParams {
  page: number;
  limit: number;
}

/**
 * Media service for handling media API communication.
 */
export const mediaService = {
  /**
   * Get paginated media files for the authenticated user.
   */
  getMedia: async (params: GetMediaParams): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MediaFile>>>(
      API_ENDPOINTS.MEDIA.LIST,
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch media');
    }

    return response.data.data;
  },

  /**
   * Get paginated favorite media files.
   */
  getFavorites: async (params: GetMediaParams): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MediaFile>>>(
      API_ENDPOINTS.MEDIA.FAVORITES,
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch favorites');
    }

    return response.data.data;
  },

  /**
   * Toggle favorite status of a media file.
   */
  toggleFavorite: async (mediaId: string): Promise<MediaFile> => {
    const response = await apiClient.patch<ApiResponse<{ media: MediaFile }>>(
      API_ENDPOINTS.MEDIA.FAVORITE(mediaId)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to toggle favorite');
    }

    return response.data.data.media;
  },

  /**
   * Delete a media file.
   */
  deleteMedia: async (mediaId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>(
      API_ENDPOINTS.MEDIA.DETAIL(mediaId)
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete media');
    }
  },
};
