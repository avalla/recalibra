import { useLanguage } from '../../../i18n/LanguageProvider';
import { tr } from '../../../i18n/core';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface StartSessionButtonProps {
  onPress: () => void;
  animatedStyle: unknown;
}

export const StartSessionButton: React.FC<StartSessionButtonProps> = ({ onPress, animatedStyle }) => {
  useLanguage();
  return (
    <Animated.View style={[animatedStyle as any, styles.startButtonContainer]}>
      <TouchableOpacity style={styles.startButton} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.startButtonContent}>
          <Ionicons name="play" size={24} color={Colors.background} style={styles.startIcon} />
          <Text style={styles.startButtonText}>{tr("Start a Session")}</Text>
        </View>
        <View style={styles.startButtonGradient} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  startButtonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  startIcon: {
    marginLeft: Spacing.xs,
  },
  startButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
