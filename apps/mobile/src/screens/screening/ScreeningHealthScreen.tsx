import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button } from '../../components';
import { useScreening } from '../../hooks';

interface HealthCondition {
  id: string;
  label: string;
}

const healthConditions: HealthCondition[] = [
  { id: 'pregnancy', label: 'Pregnancy' },
  { id: 'pacemaker', label: 'Pace-maker or implanted electronic device' },
  { id: 'seizures', label: 'History of seizures or epilepsy' },
  { id: 'cancer', label: 'Active cancer diagnosis' },
  { id: 'none', label: 'None of the above apply to me' },
];

export const ScreeningHealthScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { updateScreeningData } = useScreening();
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set());

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions((prev) => {
      const newSet = new Set(prev);
      
      if (conditionId === 'none') {
        // If "None" is selected, clear all others
        return new Set(['none']);
      }
      
      // If selecting another condition, remove "none"
      newSet.delete('none');
      
      if (newSet.has(conditionId)) {
        newSet.delete(conditionId);
      } else {
        newSet.add(conditionId);
      }
      
      return newSet;
    });
  };

  const handleNext = () => {
    const conditions = Array.from(selectedConditions).filter((c) => c !== 'none');
    updateScreeningData({ health_conditions: conditions });
    navigation.navigate('ScreeningStress');
  };

  const hasSelection = selectedConditions.size > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= 1 && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Title */}
        <Text style={styles.title}>Health & Safety Check</Text>
        <Text style={styles.subtitle}>
          Please review the list below. Select any conditions that apply to you to ensure our program is safe for your use.
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {healthConditions.map((condition) => (
            <TouchableOpacity
              key={condition.id}
              style={[
                styles.optionButton,
                selectedConditions.has(condition.id) && styles.optionButtonSelected,
              ]}
              onPress={() => toggleCondition(condition.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedConditions.has(condition.id) && styles.checkboxSelected,
                ]}
              >
                {selectedConditions.has(condition.id) && (
                  <Ionicons name="checkmark" size={16} color={Colors.background} />
                )}
              </View>
              <Text style={styles.optionText}>{condition.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Link */}
        <TouchableOpacity 
          style={styles.infoLink}
          onPress={() => Alert.alert(
            'Why do we ask this?',
            'Some vagal nerve stimulation exercises involve specific breathing patterns, cold exposure, or physical movements that may not be suitable for everyone.\n\nBy understanding your health conditions, we can:\n\n• Recommend safer exercises for you\n• Provide appropriate warnings\n• Customize your experience\n\nYour information is kept private and secure.',
            [{ text: 'Got it', style: 'default' }]
          )}
        >
          <Text style={styles.infoLinkText}>Why do we ask this?</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          label="Next"
          onPress={handleNext}
          disabled={!hasSelection}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
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
    borderColor: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  infoLink: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  infoLinkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
});
