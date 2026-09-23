import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useScreening } from '../../hooks';

export const ScreeningStressScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const { saveScreeningProfile, isLoading } = useScreening();
  const [stressLevel, setStressLevel] = useState(5);

  const handleComplete = async () => {
    const { error } = await saveScreeningProfile({ initial_stress_level: stressLevel });

    if (error) {
      Alert.alert(tr("Error"), tr("Failed to save your profile. Please try again."));
      return;
    }

    // Reset the root stack explicitly so this CTA cannot leave the user stranded
    // inside the nested screening navigator if the auth-state remount is delayed.
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={tr("Go back")}
      >
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((index) => (
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
        <Text style={styles.title}>{tr("How are you feeling right now?")}</Text>
        <Text style={styles.subtitle}>
          {tr("Select your current stress level")}</Text>

        {/* Stress Options */}
        <View style={styles.stressOptions}>
          {[
            { level: 1, emoji: '😌', label: tr("Calm") },
            { level: 3, emoji: '🙂', label: tr("Good") },
            { level: 5, emoji: '😐', label: tr("Okay") },
            { level: 7, emoji: '😟', label: tr("Stressed") },
            { level: 9, emoji: '😰', label: tr("Very stressed") },
          ].map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[
                styles.stressOption,
                stressLevel === item.level && styles.stressOptionActive,
              ]}
              onPress={() => setStressLevel(item.level)}
              accessibilityRole="radio"
              accessibilityLabel={`${item.label}, ${tr("stress level")} ${item.level}`}
              accessibilityState={{ selected: stressLevel === item.level }}
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
        <Button label={tr("Get Started")} onPress={handleComplete} loading={isLoading} />
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
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
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
