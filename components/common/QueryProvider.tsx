import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create async storage persister for persisting queries
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'cloud-media-gallery-query-client',
});

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Infinite query retry behavior
      retry: 1,
      // Refetch on window focus (useful for mobile)
      refetchOnWindowFocus: false,
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time - how long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Clear the persisted query cache from AsyncStorage.
 * Call this on logout to prevent old data from being restored.
 */
export async function clearQueryCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem('cloud-media-gallery-query-client');
    queryClient.clear();
    console.log('Query cache cleared successfully');
  } catch (error) {
    console.warn('Failed to clear query cache:', error);
  }
}

/**
 * QueryClientProvider wrapper for React Query.
 * Provides the QueryClient to the entire app with persistence.
 * Persists media and favorites queries to AsyncStorage for offline support.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: {
          // Only persist media and favorites queries
          shouldDehydrateQuery: (query) => {
            const queryKey = query.queryKey[0] as string;
            return queryKey === 'media' || queryKey === 'favorites';
          },
        },
      }}
      onSuccess={() => {
        // Query cache restored successfully
        console.log('Query cache restored from persistence');
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
