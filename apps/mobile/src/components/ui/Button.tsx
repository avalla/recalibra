import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants';
import { getGradient } from '../../constants/gradients';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'primary' ? Colors.background : Colors.primary}
      size="small"
    />
  ) : (
    <>
      {icon && iconPosition === 'left' && icon}
      <Text style={textStyles}>{label}</Text>
      {icon && iconPosition === 'right' && icon}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
        {/* @ts-ignore - LinearGradient type issue with React 19 */}
        <LinearGradient
          colors={getGradient('primary') as any}
          style={[styles.innerBase, styles[`innerSize_${size}`]]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      <View style={[styles.innerBase, styles[`innerSize_${size}`]]}>{content}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },

  innerBase: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },

  // Variants
  primary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.18)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  secondary: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  size_sm: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  size_md: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  size_lg: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  innerSize_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 40,
  },
  innerSize_md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  innerSize_lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
  },

  // Text base
  text: {
    fontWeight: FontWeight.semibold,
  },

  // Text variants
  text_primary: {
    color: Colors.background,
  },
  text_secondary: {
    color: Colors.textPrimary,
  },
  text_outline: {
    color: Colors.primary,
  },
  text_ghost: {
    color: Colors.primary,
  },

  // Text sizes
  textSize_sm: {
    fontSize: FontSize.sm,
  },
  textSize_md: {
    fontSize: FontSize.md,
  },
  textSize_lg: {
    fontSize: FontSize.lg,
  },

  textDisabled: {
    opacity: 0.7,
  },
});
