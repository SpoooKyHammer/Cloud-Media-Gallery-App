import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Text, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

/**
 * Reusable Button component with multiple variants and sizes.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  testID,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Variant styles
    if (variant === 'primary') {
      baseStyle.backgroundColor = COLORS.primary;
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = COLORS.secondary;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1.5;
      baseStyle.borderColor = COLORS.primary;
    }
    // text variant has no additional style

    // Size styles
    if (size === 'small') {
      baseStyle.paddingVertical = SPACING.sm;
      baseStyle.paddingHorizontal = SPACING.md;
    } else if (size === 'medium') {
      baseStyle.paddingVertical = SPACING.md;
      baseStyle.paddingHorizontal = SPACING.lg;
    } else if (size === 'large') {
      baseStyle.paddingVertical = SPACING.lg;
      baseStyle.paddingHorizontal = SPACING.xl;
    }

    // Additional styles
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Variant text colors
    if (variant === 'outline' || variant === 'text') {
      baseStyle.color = COLORS.primary;
    } else {
      baseStyle.color = COLORS.textInverse;
    }

    // Size font sizes
    if (size === 'small') {
      baseStyle.fontSize = 14;
    } else if (size === 'medium') {
      baseStyle.fontSize = 16;
    } else if (size === 'large') {
      baseStyle.fontSize = 18;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.textInverse} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
