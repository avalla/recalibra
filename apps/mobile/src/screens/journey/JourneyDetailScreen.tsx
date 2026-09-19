import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { formatMinutes, tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { Card, Screen } from '../../components';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useExercises } from '../../hooks';
import { getJourneyById } from '../../data/journeys';
import { getJourneyProgress, ensureJourneyProgress } from '../../db';
import { getJourneyChapterIndex, getJourneyChapterState, getJourneyCompletion, getJourneyDurationMinutes } from '../../utils/journey-ui';
import { getCurrentJourneyStep } from '../../utils/journey-runner';
import { toExerciseSessionParams } from '../../utils/quick-start';
import { orderedChapters } from '../../utils/journeys';
import type { RootStackParamList } from '../../types';

type RouteProps = RouteProp<RootStackParamList, 'JourneyDetail'>;

export const JourneyDetailScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProps>();
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
  const currentStep = journey && progress ? getCurrentJourneyStep(journey, progress) : undefined;

  const startCurrentStep = () => {
    if (!journey || !progress || progress.status === 'completed') return;
    if (!currentStep) {
      Alert.alert(tr('Journey content unavailable'), tr('The next Journey step is not available offline.'));
      return;
    }
    const exercise = exercises.find((candidate) => candidate.id === currentStep.exerciseId);
    if (!exercise) {
      Alert.alert(tr('Journey content unavailable'), tr('The exercise for this Journey step is not available offline.'));
      return;
    }
    navigation.navigate('ExerciseSession', {
      ...toExerciseSessionParams(exercise),
      journeyContext: { journeyId: journey.id, journeyVersion: journey.version, stepId: currentStep.id },
    });
  };

  if (!journey) {
    return <Screen style={styles.container}><View style={styles.empty}><Text style={styles.emptyTitle}>{tr('Journey content unavailable')}</Text><Text style={styles.emptyText}>{tr('This Journey is not available on this device.')}</Text></View></Screen>;
  }

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={tr('Go back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.kicker}>{tr('Journey')}</Text>
        <Text style={styles.title}>{tr(journey.title)}</Text>
        <Text style={styles.description}>{tr(journey.description)}</Text>

        {completion ? <Text style={styles.progress}>{tr('{{completed}} of {{total}} steps', completion)}</Text> : null}
        {durationMinutes > 0 ? <Text style={styles.duration}>{formatMinutes(durationMinutes)}</Text> : null}

        <View style={styles.timeline} accessibilityRole="list">
          {orderedChapters(journey).map((chapter) => {
            const state = getJourneyChapterState(journey, chapter, progress);
            return (
              <View key={chapter.id} style={styles.chapterRow} accessible>
                <View style={[styles.marker, state === 'completed' && styles.markerCompleted, state === 'current' && styles.markerCurrent]}>
                  <Ionicons name={state === 'completed' ? 'checkmark' : state === 'locked' ? 'lock-closed' : 'ellipse'} size={14} color={state === 'locked' ? Colors.textMuted : Colors.background} />
                </View>
                <View style={styles.chapterBody}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterIndex}>{tr('Chapter {{chapter}}', { chapter: getJourneyChapterIndex(journey, chapter) })}</Text>
                    <Text style={[styles.state, state === 'locked' && styles.stateLocked]}>{tr(state === 'completed' ? 'Completed' : state === 'current' ? 'Up next' : 'Locked')}</Text>
                  </View>
                  <Text style={styles.chapterTitle}>{tr(chapter.title)}</Text>
                  {chapter.description ? <Text style={styles.chapterDescription}>{tr(chapter.description)}</Text> : null}
                  <Text style={styles.stepCount}>{tr('{{completed}} of {{total}} steps', { completed: chapter.steps.filter((step) => progress?.completedStepIds.includes(step.id)).length, total: chapter.steps.length })}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity onPress={startCurrentStep} disabled={isLoading || exercisesLoading || progress?.status === 'completed'} style={[styles.cta, (isLoading || exercisesLoading || progress?.status === 'completed') && styles.ctaDisabled]} accessibilityRole="button" accessibilityLabel={progress?.status === 'in_progress' ? tr('Resume journey') : tr('Start this journey')}>
          <Text style={styles.ctaText}>{progress?.status === 'in_progress' ? tr('Resume journey') : progress?.status === 'completed' ? tr('Journey complete') : tr('Start this journey')}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.background} />
        </TouchableOpacity>
      </ScrollView>
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
  progress: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: Spacing.lg },
  duration: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs },
  timeline: { marginTop: Spacing.xl, gap: Spacing.md },
  chapterRow: { flexDirection: 'row', gap: Spacing.md },
  marker: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  markerCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  markerCurrent: { backgroundColor: Colors.primaryDark, borderColor: Colors.primaryDark },
  chapterBody: { flex: 1, minWidth: 0, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chapterHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  chapterIndex: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase' },
  state: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  stateLocked: { color: Colors.textMuted },
  chapterTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginTop: Spacing.xs },
  chapterDescription: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  stepCount: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
  cta: { minHeight: 52, borderRadius: BorderRadius.md, marginTop: Spacing.xl, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: Colors.background, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  empty: { flex: 1, justifyContent: 'center', padding: Spacing.lg },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.sm },
});
