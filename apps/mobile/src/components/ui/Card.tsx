import React from 'react';
import {
  View,
  StyleSheet,
  type AccessibilityState,
  type ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadow } from '../../constants';
import { getGradient, type GradientKey } from '../../constants/gradients';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  variant?: 'default' | 'elevated' | 'soft';
  gradientKey?: GradientKey;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  variant = 'default',
  gradientKey,
}) => {
  const cardStyles = [
    styles.card,
    variant === 'soft' && styles.soft,
    variant === 'elevated' && styles.elevated,
    style,
  ];

  const content = (
    <>
      {gradientKey ? (
        // @ts-ignore - LinearGradient type issue with React 19
        <LinearGradient colors={getGradient(gradientKey) as any} style={styles.gradient} />
      ) : null}
      <View style={styles.inner}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    // Neutral chrome by default. Teal is the action/state color; spending it on
    // every passive card's border + shadow diluted its signal. Interactive or
    // selected cards opt into a teal border via their own style.
    borderColor: 'rgba(148, 163, 184, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    borderColor: 'rgba(148, 163, 184, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    ...Shadow.md,
    backgroundColor: Colors.backgroundElevated,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  inner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
