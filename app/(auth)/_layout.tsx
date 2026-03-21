import { Stack } from 'expo-router';

/**
 * Auth layout for login and register screens.
 * Access is controlled by the parent Stack.Protected guard.
 */
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
