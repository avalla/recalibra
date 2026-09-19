import { enumLabel } from '../i18n/labels';
import { useLanguage } from '../i18n/LanguageProvider';
import { tr } from '../i18n/core';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';

const { width, height } = Dimensions.get('window');

interface TutorialOverlayProps {
  visible: boolean;
  exerciseName: string;
  exerciseCategory: string;
  origin?: string;
  onClose: () => void;
  onStart: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  exerciseName,
  exerciseCategory,
  origin,
  onClose,
  onStart,
}) => {
  useLanguage();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible) {
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out and slide down animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleSkip = async () => {
    await AsyncStorage.setItem('tutorial_seen', 'true');
    onClose();
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('tutorial_seen', 'true');
    onStart();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
          {/* Skip button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{tr("Skip")}</Text>
          </TouchableOpacity>

          {/* Tutorial content */}
          <View style={styles.tutorialContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={60} color={Colors.primary} />
            </View>
            
            <Text style={styles.title}>{tr("Welcome to {{name}}", { name: exerciseName })}</Text>
            <Text style={styles.subtitle}>
              {origin ? tr("Origin: {{origin}}", { origin: enumLabel(origin) }) : tr("A timeless wellness practice")}
            </Text>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>{tr("How it works:")}</Text>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.instructionText}>
                  {exerciseCategory === 'breathing' ? tr("Follow the guide provided for this exercise") : tr("Follow the written steps at your own pace")}
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.instructionText}>
                  {tr("Choose your stress rating before starting")}</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.instructionText}>
                  {tr("Pause any time to read the full instructions")}</Text>
              </View>
            </View>

            <Text style={styles.tip}>
              {tr("Read the specific warnings and instructions before you begin.")}</Text>
          </View>

          {/* Start button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>{tr("Start Exercise")}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.background} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  tutorialContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  instructions: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  instructionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  instructionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  tip: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
});
