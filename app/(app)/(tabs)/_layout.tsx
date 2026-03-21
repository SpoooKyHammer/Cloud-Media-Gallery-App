import React from 'react';
import { Stack } from 'expo-router';

/**
 * Tabs layout for the main app navigation.
 */
export default function TabsLayout() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
    </>
  );
}
