import { Stack } from 'expo-router';

/**
 * App layout for authenticated screens.
 * Access is controlled by the parent Stack.Protected guard.
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
