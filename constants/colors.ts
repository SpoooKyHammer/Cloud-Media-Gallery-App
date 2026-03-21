export const COLORS = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0056B3',

  // Secondary colors
  secondary: '#5856D6',
  secondaryLight: '#9492E8',
  secondaryDark: '#3D3CB5',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E5E5EA',

  // Text colors
  text: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textInverse: '#FFFFFF',

  // Status colors
  error: '#FF3B30',
  errorLight: '#FF6B61',
  success: '#34C759',
  successLight: '#64D97A',
  warning: '#FF9500',
  warningLight: '#FFB340',
  info: '#007AFF',

  // Border colors
  border: '#C6C6C8',
  borderLight: '#D1D1D6',

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Dark mode colors (for future use)
  darkBackground: '#000000',
  darkBackgroundSecondary: '#1C1C1E',
  darkBackgroundTertiary: '#2C2C2E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#EBEBF5',
  darkTextTertiary: '#98989D',
  darkBorder: '#38383A',
} as const;

export type ColorKey = keyof typeof COLORS;
