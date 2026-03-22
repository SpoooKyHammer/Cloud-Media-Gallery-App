import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSession } from '../hooks/useAuth';
import { QueryProvider } from '../components/common/QueryProvider';
import { initializeCacheMemory } from '../services/cacheService';
import { COLORS } from '../constants';

/**
 * Root layout that handles authentication state initialization.
 * Protected routes are handled using Stack.Protected.
 */
export default function RootLayout() {
  const { initialize, isInitialized, isAuthenticated } = useSession();

  useEffect(() => {
    // Initialize auth state from secure storage on app mount
    initialize();
    // Initialize cache memory for fast sync lookups
    initializeCacheMemory();
  }, [initialize]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryProvider>
      <Stack>
        {/* Auth routes - only accessible when NOT authenticated */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* App routes - only accessible when authenticated */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
