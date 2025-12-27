import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useScreening } from '../../hooks';

export const ScreeningStressScreen: React.FC = () => {
  const { saveScreeningProfile, isLoading } = useScreening();
  const [stressLevel, setStressLevel] = useState(5);

  const handleComplete = async () => {
    const { error } = await saveScreeningProfile({ initial_stress_level: stressLevel });

    if (error) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
      return;
    }

    // The RootNavigator will automatically redirect to Main since onboarding_completed is now true
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= 2 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>How are you feeling right now?</Text>
        <Text style={styles.subtitle}>
          Select your current stress level
        </Text>

        {/* Stress Options */}
        <View style={styles.stressOptions}>
          {[
            { level: 1, emoji: '😌', label: 'Calm' },
            { level: 3, emoji: '🙂', label: 'Good' },
            { level: 5, emoji: '😐', label: 'Okay' },
            { level: 7, emoji: '😟', label: 'Stressed' },
            { level: 9, emoji: '😰', label: 'Very stressed' },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[
                styles.stressOption,
                stressLevel === item.level && styles.stressOptionActive,
              ]}
              onPress={() => setStressLevel(item.level)}
            >
              <Text style={styles.stressEmoji}>{item.emoji}</Text>
              <Text style={[
                styles.stressLabel,
                stressLevel === item.level && styles.stressLabelActive,
              ]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button label="Get Started" onPress={handleComplete} loading={isLoading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundLight,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  stressOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stressOption: {
    width: 100,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressOptionActive: {
    backgroundColor: Colors.primary,
  },
  stressEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  stressLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  stressLabelActive: {
    color: Colors.background,
  },
  footer: {
    paddingBottom: Spacing.lg,
  },
});
