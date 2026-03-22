# Cloud Media Gallery - Mobile App

React Native mobile application built with Expo for managing and viewing media files with offline support.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [State Management](#state-management)
5. [Token Handling](#token-handling)
6. [Offline Handling](#offline-handling)
7. [Setup Instructions](#setup-instructions)
8. [Deployment](#deployment)
9. [Performance Optimizations](#performance-optimizations)
10. [Known Limitations](#known-limitations)
11. [Future Improvements](#future-improvements)

---

## Project Overview

Mobile app for uploading, viewing, and managing photos/videos with:
- **Media Upload**: Camera capture or gallery selection (max 10 files)
- **Infinite Scroll Gallery**: Paginated media display
- **Favorites System**: Mark and view favorite media
- **Offline Support**: View cached media when offline
- **Secure Auth**: JWT-based authentication with token refresh

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript 5 |
| Navigation | Expo Router (file-based) |
| State | Zustand (auth) + React Query (server) |
| HTTP Client | Axios |
| Storage | SecureStore (tokens) + AsyncStorage (cache) |
| Media | expo-image, expo-video, expo-image-picker |
| Network | @react-native-community/netinfo |
| Platform | Android |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Native App (Expo)                │
├─────────────────────────────────────────────────────┤
│  Screens → Components → Hooks → Services → API      │
│                    ↓                                │
│            State Management                         │
│  - Zustand (auth)                                   │
│  - React Query (server state + cache)               │
└─────────────────────────────────────────────────────┘
                        │
                        │ REST API
                        ▼
              ┌─────────────────┐
              │  Backend API    │
              │  (Express.js)   │
              └─────────────────┘
```

### Navigation Structure

```
app/
├── _layout.tsx          # Root layout (auth check)
├── (auth)/              # Auth screens (protected: !authenticated)
│   ├── login.tsx
│   └── register.tsx
└── (app)/               # Main app (protected: authenticated)
    ├── _layout.tsx      # Tab navigation
    └── (tabs)/
        ├── gallery.tsx      # Media gallery
        └── favorites.tsx    # Favorite media
```

### Data Flow

```
User Action → Component → Hook → Service → API Client → Backend
                ↓           ↓
            UI State   React Query Cache
                         ↓
                   AsyncStorage (persist)
```

---

## Folder Structure

```
app/
├── app/                      # Expo Router screens
│   ├── (app)/(tabs)/         # Main app tabs
│   │   ├── gallery.tsx
│   │   └── favorites.tsx
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── _layout.tsx           # Root layout
│   └── index.tsx             # Root
│
├── components/
│   ├── common/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── QueryProvider.tsx
│   └── media/                # Media-specific components
│       ├── MediaCard.tsx
│       ├── MediaViewer.tsx
│       ├── FullScreenPreview.tsx
│       └── UploadModal.tsx
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts
│   ├── useMedia.ts
│   ├── useNetworkStatus.ts
│   ├── useOfflineCache.ts
│   └── useMediaCapture.ts
│
├── services/                 # Business logic
│   ├── authService.ts
│   ├── mediaService.ts
│   └── cacheService.ts
│
├── store/                    # Zustand stores
│   └── authStore.ts
│
├── types/                    # TypeScript types
│   └── index.ts
│
├── constants/                # App constants
│   ├── apiEndpoints.ts
│   ├── cache.ts
│   ├── colors.ts
│   └── spacing.ts
│
├── utils/                    # Helper functions
│   ├── errorHandler.ts
│   └── getVideoThumbnail.ts
│
├── api/                      # API client
│   └── client.ts
│
├── assets/                   # Images, fonts, icons
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── package.json
└── tsconfig.json
```

---

## State Management

### Hybrid Strategy

| State Type | Tool | Persistence |
|------------|------|-------------|
| **Auth State** | Zustand | SecureStore |
| **Server State** | React Query | AsyncStorage |
| **UI State** | useState/useReducer | None (ephemeral) |
| **Cache Metadata** | AsyncStorage + Map | AsyncStorage |

### Auth State (Zustand)

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

// Usage
const { isAuthenticated, logout } = useAuth();
```

**Persistence:**
- Tokens stored in SecureStore (encrypted)
- Survives app restarts
- Cleared on logout

### Server State (React Query)

```typescript
// hooks/useMedia.ts
export const useMediaInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['media'],
    queryFn: async ({ pageParam }) => {
      const isOnline = await checkOnline();
      if (!isOnline) throw new Error('Offline');
      return mediaService.getMedia({ page: pageParam, limit: 20 });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

**Persistence:**
- Queries persisted to AsyncStorage via `PersistQueryClientProvider`
- Auto-refetch on reconnect
- Optimistic updates for mutations

### Cache Architecture

Single-layer file caching (expo-image caching disabled):

```typescript
// services/cacheService.ts
const cache = new Map<string, string>(); // In-memory for sync lookups

// AsyncStorage keys:
// - cache:index              // Array of mediaIds
// - cache:{mediaId}          // CachedMediaMetadata
// Files: FileSystem.documentDirectory/cloud-media-gallery/

// expo-image used without caching (cachePolicy="none")
// All caching handled by cacheService.downloadAndCache()
```

---

## Token Handling

### JWT Strategy

| Token | Expiry | Storage | Purpose |
|-------|--------|---------|---------|
| **Access Token** | 15 min | SecureStore | API requests |
| **Refresh Token** | 7 days | SecureStore | Get new access token |

### Token Flow

```
Login
  ↓
Store tokens in SecureStore
  ↓
API requests: Authorization: Bearer {accessToken}
  ↓
Access token expires (15m)
  ↓
API returns 401
  ↓
API interceptor catches 401
  ↓
Call /api/auth/refresh-token
  ↓
Store new tokens
  ↓
Retry original request
  ↓
Refresh token expires (7d)
  ↓
Force logout → Login screen
```

### Implementation

```typescript
// api/client.ts - Auth interceptor
initAuthInterceptor(
  () => authStore.getState().accessToken,
  () => authStore.getState().logout(),
  () => authStore.getState().refreshToken()
);

// Automatically:
// 1. Adds Bearer token to requests
// 2. Catches 401 errors
// 3. Refreshes token
// 4. Retries failed request
```

### Logout

```typescript
// store/authStore.ts - clearAuth()
clearAuth: async () => {
  // 1. Clear SecureStore
  await SecureStore.deleteItemAsync(ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(USER_DATA);
  
  // 2. Clear caches
  await clearCache();        // File cache
  clearCacheMemory();        // In-memory map
  await clearQueryCache();   // React Query cache
  
  // 3. Reset state
  set({ user: null, isAuthenticated: false });
}
```

---

## Offline Handling

### Offline Strategy

| Scenario | Behavior |
|----------|----------|
| **First load (online)** | Fetch API, cache files, display |
| **Subsequent (offline)** | Show cached data immediately |
| **App restart (offline)** | Auth persists, cached media visible |
| **Upload (offline)** | Disabled, show offline banner |
| **Network loss** | Show cached data, no error |

### Components

1. **Network Detection** (`useNetworkStatus.ts`):
   ```typescript
   const { isOnline, isLoading: isNetworkLoading } = useNetworkStatus();
   ```

2. **Offline Banner** (`OfflineBanner.tsx`):
   - Shows when: `!isOnline && !isNetworkLoading && hasCachedData`
   - Dismissible

3. **Cache Service** (`cacheService.ts`):
   - `downloadAndCache()`: Downloads + stores metadata
   - `getCachedPathSync()`: Fast in-memory lookup (O(1))
   - `initializeCacheMemory()`: Pre-populates map on app start

4. **React Query Persistence**:
   - Media/favorites queries persisted to AsyncStorage
   - Survives app restarts

### Loading States

```typescript
const { data, isPending, isError } = useMediaInfinite();

// isPending: true only on very first load (no cache)
// isError: only shows if NO cached data exists
// isFetching: background refetch (keeps showing data)
```

### Background Caching

```typescript
// gallery.tsx
useEffect(() => {
  if (!isOnline || mediaItems.length === 0) return;
  
  const cacheAll = async () => {
    for (const media of mediaItems) {
      if (!media.cached_path) {
        await downloadAndCache(media);
      }
    }
  };
  
  cacheAll();
}, [isOnline, mediaItems]);
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for emulator)
- Expo Go app (for testing on physical device)

### 1. Install Dependencies

```bash
cd app/
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Update with API URL
# For Android emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For physical device (same network):
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

### 3. Start Development Server

```bash
# Start Expo dev server
npx expo start

# Then choose:
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go (physical device)
```

### 4. Development with Expo Go

**On Physical Device:**
1. Install Expo Go from Play Store
2. Scan QR code from terminal
3. App loads in Expo Go

**Note:** Expo Go has limitations:
- Some native modules may not work
- Use development builds for full testing

### 5. Create Development Build (Recommended)

```bash
# Configure EAS
eas build:configure

# Create development build
eas build --platform android --profile development

# Install APK on device
```

### 6. Run on Android Emulator

```bash
# Start Android Emulator from Android Studio
# Then run:
npx expo start --android
```

---

## Deployment

### EAS Build Setup

1. **Login to Expo**
   ```bash
   eas login
   ```

2. **Configure Project**
   ```bash
   eas build:configure
   ```

3. **Update app.json**
   ```json
   {
     "expo": {
       "name": "Cloud Media Gallery",
       "slug": "cloud-media-gallery",
       "android": {
         "package": "com.spoookyhammer.cloudmediagallery",
         "adaptiveIcon": {
           "backgroundColor": "#E6F4FE"
         }
       }
     }
   }
   ```

### Build Types

#### 1. Development Build (for testing)

```bash
eas build --platform android --profile development
```

**Use:** Testing on real devices, debugging

#### 2. Preview Build (internal distribution)

```bash
eas build --platform android --profile preview
```

**Use:** QA testing, stakeholder demos, EAS Preview

#### 3. Production Build (Google Play release)

```bash
eas build --platform android --profile production
```

**Use:** Google Play Store submission

### Submit to Google Play

```bash
eas submit --platform android
```

### OTA Updates (Expo Application Services)

```bash
# Push over-the-air update
eas update --branch production --message "Bug fixes"
```

### Build Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 18.4.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Performance Optimizations

### FlatList Optimization

```typescript
<FlatList
  data={mediaItems}
  renderItem={({ item }) => <MediaCard media={item} />}
  keyExtractor={(item) => item._id}
  numColumns={3}
  initialNumToRender={12}
  maxToRenderPerBatch={12}
  windowSize={5}
  removeClippedSubviews={true}
  updateCellsBatchingPeriod={100}
/>
```

### React Query Optimization

```typescript
useInfiniteQuery({
  queryKey: ['media'],
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  getNextPageParam: (lastPage) => {
    const { page, totalPages } = lastPage.pagination;
    return page < totalPages ? page + 1 : undefined;
  },
});
```

### Memoization

```typescript
// useMemo for expensive computations
const mediaItems = useMemo(() => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page) => page.data);
}, [data]);

// useCallback for event handlers
const handlePress = useCallback((id: string) => {
  router.push(`/media/${id}`);
}, []);
```

### Video Playback

```typescript
// Pause videos when not visible
<VideoSlide
  source={{ uri: media.file_url }}
  isPlaying={isVisible} // Explicit pause control
  resizeMode="cover"
/>
```

### Bundle Size

- React Compiler for automatic memoization
- Code splitting with Expo Router
- Lazy loading for heavy components

---

## Known Limitations

| Limitation | Value/Behavior |
|------------|----------------|
| **Max upload files** | 10 per request |
| **Multi-select limit** | 10 items from gallery |
| **Video duration** | Max 60 seconds (camera) |
| **Offline upload** | Not supported (no queue) |
| **Cache** | File cache only (expo-image caching disabled) |
| **Cache size** | 500MB max (LRU eviction) |
| **Cache TTL** | 7 days |
| **Search** | Not implemented |
| **Albums/folders** | Not implemented |
| **Platform** | Android only |

---

## Future Improvements

- [ ] Offline upload queue
- [ ] Image editing (crop, rotate, filters)
- [ ] Search and filter functionality
- [ ] Albums/folders organization
- [ ] Share functionality (deep links)
- [ ] Dark mode toggle

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run lint` | Run ESLint |

---

