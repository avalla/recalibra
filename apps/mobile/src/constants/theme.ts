/**
 * Recalibra Design System
 * Based on prototype screenshots
 */

export const Colors = {
  // Primary colors
  primary: '#2DD4BF', // Cyan/Teal accent
  primaryDark: '#14B8A6',
  primaryLight: '#5EEAD4',

  // Background colors
  background: '#0F1A19', // Dark teal background
  backgroundLight: '#1A2F2A',
  backgroundCard: '#1E3A34',
  backgroundElevated: '#243D38',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B5C9C2',
  textMuted: '#A0B6AE',

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Stress level colors
  stressLow: '#22C55E',
  stressMedium: '#F59E0B',
  stressHigh: '#EF4444',

  // Border colors
  border: '#334155',
  borderLight: '#475569',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const FontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semibold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  heading: 'DMSerifDisplay-Regular',
  headingItalic: 'DMSerifDisplay-Italic',
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
