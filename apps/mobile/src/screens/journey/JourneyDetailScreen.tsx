import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMinutes, tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { Screen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useExercises } from '../../hooks';
import { getJourneyById } from '../../data/journeys';
import { getJourneyProgress, ensureJourneyProgress, startJourney } from '../../db';
import { getJourneyChapterIndex, getJourneyChapterState, getJourneyCompletion, getJourneyDurationMinutes } from '../../utils/journey-ui';
import { getCurrentJourneyStep } from '../../utils/journey-runner';
import { orderedChapters } from '../../utils/journeys';
import type { RootStackParamList } from '../../types';

type RouteProps = RouteProp<RootStackParamList, 'JourneyDetail'>;

export const JourneyDetailScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { exercises, isLoading: exercisesLoading } = useExercises();
  const journey = getJourneyById(route.params.journeyId);
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getJourneyProgress>>>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    if (!journey) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setProgress(await ensureJourneyProgress(journey));
    } catch {
      setProgress(await getJourneyProgress(journey.id));
    } finally {
      setIsLoading(false);
    }
  }, [journey]);

  useFocusEffect(useCallback(() => { void loadProgress(); }, [loadProgress]));

  const completion = useMemo(() => journey ? getJourneyCompletion(journey, progress) : null, [journey, progress]);
  const durationMinutes = journey ? getJourneyDurationMinutes(journey, exercises) : 0;
  const footerHeight = 52 + Spacing.md + Spacing.sm + insets.bottom;

  const startCurrentStep = async () => {
    if (!journey || !progress || progress.status === 'completed') return;

    setIsLoading(true);
    try {
      const activeProgress = progress.status === 'not_started' ? await startJourney(journey) : progress;
      setProgress(activeProgress);
      const activeStep = getCurrentJourneyStep(journey, activeProgress);
      if (!activeStep) {
        Alert.alert(tr('Journey content unavailable'), tr('The next Journey step is not available offline.'));
        return;
      }
      const exercise = exercises.find((candidate) => candidate.id === activeStep.exerciseId);
      if (!exercise) {
        Alert.alert(tr('Journey content unavailable'), tr('The exercise for this Journey step is not available offline.'));
        return;
      }
      navigation.navigate(exercise.safety_warning ? 'ExerciseSafety' : 'ExercisePreparation', {
        exerciseId: exercise.id,
        journeyContext: { journeyId: journey.id, journeyVersion: journey.version, stepId: activeStep.id },
      });
    } catch {
      Alert.alert(tr('Journey content unavailable'), tr('This Journey is not available on this device.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!journey) {
    return <Screen style={styles.container}><View style={styles.empty}><Text style={styles.emptyTitle}>{tr('Journey content unavailable')}</Text><Text style={styles.emptyText}>{tr('This Journey is not available on this device.')}</Text></View></Screen>;
  }

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footerHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={tr('Go back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.kicker}>{tr('Journey')}</Text>
        <Text style={styles.title}>{tr(journey.title)}</Text>
        <Text style={styles.description}>{tr(journey.description)}</Text>

        <View style={styles.meta}>
          {completion ? <Text style={styles.progress}>{tr('{{completed}} of {{total}} steps', completion)}</Text> : null}
          {completion && durationMinutes > 0 ? <View style={styles.metaDot} /> : null}
          {durationMinutes > 0 ? <Text style={styles.duration}>{formatMinutes(durationMinutes)}</Text> : null}
        </View>

        <View style={styles.timeline} accessibilityRole="list">
          {orderedChapters(journey).map((chapter) => {
            const state = getJourneyChapterState(journey, chapter, progress);
            return (
              <View key={chapter.id} style={[styles.chapterRow, state === 'current' && styles.chapterRowCurrent]} accessible>
                <View style={[styles.marker, state === 'completed' && styles.markerCompleted, state === 'current' && styles.markerCurrent]}>
                  <Ionicons name={state === 'completed' ? 'checkmark' : state === 'locked' ? 'lock-closed' : 'ellipse'} size={14} color={state === 'locked' ? Colors.textMuted : Colors.background} />
                </View>
                <View style={styles.chapterBody}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterIndex}>{tr('Chapter {{chapter}}', { chapter: getJourneyChapterIndex(journey, chapter) })}</Text>
                    <Text style={[styles.state, state === 'locked' && styles.stateLocked]}>{tr(state === 'completed' ? 'Completed' : state === 'current' ? 'Up next' : 'Locked')}</Text>
                  </View>
                  <Text style={styles.chapterTitle}>{tr(chapter.title)}</Text>
                  {chapter.description && state === 'current' ? <Text style={styles.chapterDescription}>{tr(chapter.description)}</Text> : null}
                  <Text style={styles.stepCount}>{tr('{{completed}} of {{total}} steps', { completed: chapter.steps.filter((step) => progress?.completedStepIds.includes(step.id)).length, total: chapter.steps.length })}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      <View style={styles.footerContainer}>
        <SafeAreaView style={styles.footerContent} edges={['bottom']}>
          <TouchableOpacity onPress={startCurrentStep} disabled={isLoading || exercisesLoading || progress?.status === 'completed'} style={[styles.cta, (isLoading || exercisesLoading || progress?.status === 'completed') && styles.ctaDisabled]} accessibilityRole="button" accessibilityLabel={progress?.status === 'in_progress' ? tr('Resume journey') : tr('Start this journey')}>
            <Text style={styles.ctaText}>{progress?.status === 'in_progress' ? tr('Resume journey') : progress?.status === 'completed' ? tr('Journey complete') : tr('Start this journey')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backButton: { minWidth: 48, minHeight: 48, justifyContent: 'center' },
  kicker: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.xs },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  progress: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  duration: { color: Colors.textMuted, fontSize: FontSize.sm },
  metaDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: Colors.textMuted },
  timeline: { marginTop: Spacing.xl, gap: 0 },
  chapterRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chapterRowCurrent: { marginVertical: Spacing.xs, paddingHorizontal: Spacing.md, backgroundColor: Colors.backgroundCard, borderBottomWidth: 0, borderRadius: BorderRadius.md },
  marker: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  markerCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  markerCurrent: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  chapterBody: { flex: 1, minWidth: 0 },
  chapterHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  chapterIndex: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase' },
  state: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  stateLocked: { color: Colors.textMuted },
  chapterTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.xs },
  chapterDescription: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  stepCount: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xs },
  footerContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  footerContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  cta: { minHeight: 52, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: Colors.background, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  empty: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.sm },
});
