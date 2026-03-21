const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${BASE_URL}/auth/register`,
    LOGIN: `${BASE_URL}/auth/login`,
    REFRESH_TOKEN: `${BASE_URL}/auth/refresh-token`,
    ME: `${BASE_URL}/auth/me`,
  },
  MEDIA: {
    LIST: `${BASE_URL}/media`,
    UPLOAD: `${BASE_URL}/media/upload`,
    DETAIL: (id: string) => `${BASE_URL}/media/${id}`,
    FAVORITE: (id: string) => `${BASE_URL}/media/${id}/favorite`,
    FAVORITES: `${BASE_URL}/media/favorites`,
  },
} as const;

export const API_TIMEOUT = 30000; // 30 seconds
