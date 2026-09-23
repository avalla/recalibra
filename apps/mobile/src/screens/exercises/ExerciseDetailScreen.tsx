import { enumLabel } from '../../i18n/labels';
import { useLanguage } from '../../i18n/LanguageProvider';
import { formatMinutes, tr } from '../../i18n/core';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { BorderRadius, Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { ExerciseAnimation, Screen } from '../../components';
import { useExercises } from '../../hooks';
import type { RootStackParamList } from '../../types';

type DetailRouteProps = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRouteProps>();
  const { localizedExercises: exercises, isLoading, toggleFavorite } = useExercises();
  const [showInstructions, setShowInstructions] = useState(false);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === route.params.exerciseId) ?? null,
    [exercises, route.params.exerciseId],
  );

  if (isLoading || !exercise) {
    return (
      <Screen style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{tr('Loading...')}</Text>
        </View>
      </Screen>
    );
  }

  const start = () => {
    navigation.navigate(exercise.safety_warning ? 'ExerciseSafety' : 'ExercisePreparation', {
      exerciseId: exercise.id,
    });
  };

  return (
    <Screen style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={tr('Go back')}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleFavorite(exercise.id)}
            accessibilityRole="button"
            accessibilityLabel={exercise.is_favorite ? tr('Remove from favorites') : tr('Add to favorites')}
            accessibilityState={{ selected: exercise.is_favorite }}
          >
            <Ionicons name={exercise.is_favorite ? 'heart' : 'heart-outline'} size={22} color={exercise.is_favorite ? Colors.primary : Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <ExerciseAnimation exercise={exercise} size={144} style={styles.heroIllustration} />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{enumLabel(exercise.category)}</Text>
          <Text style={styles.title}>{exercise.name}</Text>
          <View style={styles.metaRow}>
            <Meta icon="time-outline" label={formatMinutes(exercise.duration_minutes)} />
            <Meta icon="speedometer-outline" label={formatLevel(exercise.level)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tr('How it works')}</Text>
            <Text style={styles.description}>{exercise.description}</Text>
          </View>

          {exercise.history ? <Text style={styles.metadata}>{exercise.history}</Text> : null}

          <TouchableOpacity
            style={styles.instructionsButton}
            onPress={() => setShowInstructions((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showInstructions }}
          >
            <View>
              <Text style={styles.instructionsTitle}>{tr('See all steps')}</Text>
              <Text style={styles.instructionsMeta}>{exercise.instructions.length} {tr('steps')}</Text>
            </View>
            <Ionicons name={showInstructions ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
          </TouchableOpacity>

          {showInstructions ? (
            <View style={styles.instructionsList}>
              {exercise.instructions.map((step) => (
                <View style={styles.instructionRow} key={step.step}>
                  <View style={styles.stepBadge}><Text style={styles.stepNumber}>{step.step}</Text></View>
                  <Text style={styles.instructionText}>{step.instruction}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={start} accessibilityRole="button" accessibilityLabel={tr('Start')}>
          <Text style={styles.primaryButtonText}>{tr('Start')}</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return <View style={styles.metaItem}><Ionicons name={icon} size={17} color={Colors.primary} /><Text style={styles.metaText}>{label}</Text></View>;
}

function formatLevel(level: string): string {
  if (level === 'beginner') return tr('Beginner');
  if (level === 'intermediate') return tr('Intermediate');
  if (level === 'advanced') return tr('Advanced');
  return enumLabel(level);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
  scrollContent: { paddingBottom: Spacing.xl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard },
  hero: { height: 190, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.backgroundCard },
  heroIllustration: { width: '100%', height: '100%' },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  eyebrow: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.7 },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, lineHeight: 38, fontFamily: FontFamily.heading, marginTop: Spacing.xs },
  metaRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  section: { marginTop: Spacing.xl },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 25 },
  metadata: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.lg },
  instructionsButton: { minHeight: 64, marginTop: Spacing.xl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  instructionsTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  instructionsMeta: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  instructionsList: { gap: Spacing.md, paddingTop: Spacing.md },
  instructionRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepBadge: { width: 28, height: 28, borderRadius: BorderRadius.full, backgroundColor: 'rgba(45, 212, 191, 0.18)', alignItems: 'center', justifyContent: 'center' },
  stepNumber: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  instructionText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 21 },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  primaryButton: { minHeight: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  primaryButtonText: { color: Colors.background, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
