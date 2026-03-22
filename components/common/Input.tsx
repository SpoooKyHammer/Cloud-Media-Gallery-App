import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

/**
 * Reusable Input component with label, icons, and error state.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  showPasswordToggle,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordInput = showPasswordToggle && secureTextEntry;
  const actualSecureTextEntry = isPasswordInput ? !isPasswordVisible : secureTextEntry;

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.background,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingHorizontal: SPACING.md,
    };

    if (error) {
      baseStyle.borderColor = COLORS.error;
    }
    if (props.editable === false) {
      baseStyle.backgroundColor = COLORS.backgroundSecondary;
    }

    return baseStyle;
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: 16,
      color: COLORS.text,
      paddingVertical: SPACING.md,
    };

    if (leftIcon) {
      baseStyle.marginLeft = SPACING.sm;
    }
    if (rightIcon || isPasswordInput) {
      baseStyle.marginRight = SPACING.sm;
    }

    // Add custom style overrides
    if (style) {
      return { ...baseStyle, ...(style as TextStyle) };
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={getInputContainerStyle()}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={getInputStyle()}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={actualSecureTextEntry}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        {isPasswordInput && (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.passwordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    marginLeft: SPACING.sm,
  },
  passwordToggle: {
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
