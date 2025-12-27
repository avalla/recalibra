import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../constants';

interface HomeHeaderProps {
  onQuickStartPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onQuickStartPress }) => {
  const Gradient = LinearGradient as unknown as React.ComponentType<any>;

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Ionicons name="leaf" size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>Recalibra</Text>
      </View>
      <TouchableOpacity onPress={onQuickStartPress} style={styles.quickStartButton} activeOpacity={0.85}>
        <Gradient
          colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickStartGradient}
        >
          <Ionicons name="flash" size={16} color={Colors.background} style={styles.quickStartIcon} />
          <Text style={styles.quickStartText}>Quick Start</Text>
        </Gradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
  },
  quickStartButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  quickStartIcon: {
    marginRight: 6,
  },
  quickStartText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
