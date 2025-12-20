import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { getGradient, type GradientKey } from '../../constants/gradients';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  gradientKey?: GradientKey;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GradientButton({
  label,
  onPress,
  gradientKey = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: GradientButtonProps) {
  const isDisabled = disabled || loading;
  const gradientColors = getGradient(gradientKey);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.button, isDisabled && styles.disabled, style]}
    >
      {/* @ts-ignore - LinearGradient type issue with React 19 */}
      <LinearGradient colors={gradientColors as any} style={styles.gradient}>
        {loading ? (
          <ActivityIndicator color={Colors.background} size="small" />
        ) : (
          <Text style={[styles.text, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  text: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  disabled: {
    opacity: 0.55,
  },
});
