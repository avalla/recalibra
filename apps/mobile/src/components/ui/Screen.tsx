import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants';
import { getGradient, type GradientKey } from '../../constants/gradients';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  gradientKey?: GradientKey;
  overlayOpacity?: number;
  disableGradient?: boolean;
}

export function Screen({
  children,
  style,
  edges,
  gradientKey = 'background',
  overlayOpacity = 0.35,
  disableGradient = false,
}: ScreenProps) {
  const gradientColors = getGradient(gradientKey);

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {!disableGradient && (
        <>
          {/* @ts-ignore - LinearGradient type issue with React 19 */}
          <LinearGradient colors={gradientColors as any} style={styles.background} />
          <View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </>
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
});
