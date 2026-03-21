import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { COLORS, SPACING } from '../../../constants';

/**
 * Home screen - Main app screen shown after authentication.
 * This is a placeholder that will be replaced with the actual gallery.
 */
export default function HomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>You are logged in as:</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            size="large"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  email: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xxl,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
});
