import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';

export interface OfflineBannerProps {
  /**
   * Whether to show the offline banner.
   */
  visible: boolean;

  /**
   * Optional callback when the banner is dismissed.
   */
  onDismiss?: () => void;
}

/**
 * Banner component displayed when the device is offline.
 * Shows a warning message and can be dismissed by the user.
 */
export const OfflineBanner = ({ visible, onDismiss }: OfflineBannerProps) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color={COLORS.textInverse} style={styles.icon} />
        <Text style={styles.message}>You&apos;re offline - Some features may be limited</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton} hitSlop={10}>
          <Ionicons name="close" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  message: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dismissButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
