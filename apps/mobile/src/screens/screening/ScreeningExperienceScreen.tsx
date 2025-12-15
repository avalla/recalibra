import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useScreening } from '../../hooks';
import type { MeditationExperience } from '../../types';

interface ExperienceOption {
  id: MeditationExperience;
  label: string;
}

const experienceOptions: ExperienceOption[] = [
  { id: 'none', label: 'Never tried it' },
  { id: 'beginner', label: 'Beginner (Tried it a few times)' },
  { id: 'intermediate', label: 'Intermediate (Practice occasionally)' },
  { id: 'advanced', label: 'Advanced (Regular practice)' },
];

export const ScreeningExperienceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { updateScreeningData } = useScreening();
  const [selectedLevel, setSelectedLevel] = useState<MeditationExperience | null>(null);

  const handleNext = () => {
    if (selectedLevel) {
      updateScreeningData({ meditation_experience: selectedLevel });
      navigation.navigate('ScreeningHealth');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === 0 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>
          What's your experience with breathing & meditation?
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {experienceOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedLevel === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => setSelectedLevel(option.id)}
          >
            <View style={styles.radioOuter}>
              {selectedLevel === option.id && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.optionText,
                selectedLevel === option.id && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          label="Next"
          onPress={handleNext}
          disabled={!selectedLevel}
        />
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
    marginTop: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundLight,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  questionContainer: {
    marginBottom: Spacing.xxl,
  },
  questionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 36,
  },
  optionsContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  optionText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  optionTextSelected: {
    color: Colors.background,
    fontWeight: FontWeight.medium,
  },
  footer: {
    paddingBottom: Spacing.lg,
  },
});
