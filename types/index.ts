// User types
export interface User {
  _id: string;
  name: string;
  email: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  error?: { message: string; stack?: string };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Media types
export type MediaType = 'image' | 'video';

export interface MediaFile {
  _id: string;
  user_id: string;
  media_type: MediaType;
  file_url: string;
  file_key?: string;
  is_favorite: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Local cached file path (file:// URI).
   * Populated when media is cached for offline viewing.
   */
  cached_path?: string;
}

// Auth input types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  login: undefined;
  register: undefined;
};

export type TabsParamList = {
  index: undefined;
  gallery: undefined;
  favorites: undefined;
  profile: undefined;
};
