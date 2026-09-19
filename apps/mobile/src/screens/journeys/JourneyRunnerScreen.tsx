import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen } from '../../components';
import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { returnToCenterJourney } from '../../data/journeys';
import { getJourneyEntryChapter } from '../../features/journeys/state';
import { useExercises, useJourney, useSubscription } from '../../hooks';
import { toExerciseSessionParams } from '../../utils/quick-start';
import type { RootStackParamList } from '../../types';

type Route = RouteProp<RootStackParamList, 'JourneyRunner'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const JourneyRunnerScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const journey = route.params.journeyId === returnToCenterJourney.id ? returnToCenterJourney : null;
  const { progress, begin, isLoading: isJourneyLoading } = useJourney(route.params.journeyId);
  const { exercises, isLoading: isExercisesLoading } = useExercises();
  const { canAccessExercise, presentPaywall, isLoading: isSubscriptionLoading } = useSubscription();

  const chapterCount = journey?.chapters.length ?? 0;
  const chapterIndex = progress
    ? Math.max(0, Math.min(
        route.params.chapterIndex ?? getJourneyEntryChapter(progress, chapterCount),
        progress.currentChapter,
        Math.max(0, chapterCount - 1)
      ))
    : null;
  const chapter = chapterIndex === null ? undefined : journey?.chapters[chapterIndex];
  const exercise = useMemo(
    () => exercises.find((item) => item.slug === chapter?.exerciseSlug),
    [chapter?.exerciseSlug, exercises]
  );

  useEffect(() => {
    if (
      progress &&
      !isJourneyLoading &&
      exercise &&
      !isSubscriptionLoading &&
      canAccessExercise(exercise.slug, exercise.is_premium) &&
      !progress.lastStartedAt
    ) {
      begin();
    }
  }, [begin, canAccessExercise, exercise, isJourneyLoading, isSubscriptionLoading, progress]);

  if (isJourneyLoading) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.loadingText} accessibilityLiveRegion="polite">
          Caricamento del percorso…
        </Text>
      </Screen>
    );
  }

  if (!journey || !chapter || chapterIndex === null) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.errorText}>Capitolo non disponibile.</Text>
      </Screen>
    );
  }

  const startChapter = async () => {
    if (!exercise) return;
    if (!canAccessExercise(exercise.slug, exercise.is_premium)) {
      const didPurchase = await presentPaywall();
      if (!didPurchase) navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('ExerciseSession', {
      ...toExerciseSessionParams(exercise),
      journeyId: journey.id,
      journeyChapterIndex: chapterIndex,
    });
  };

  const exerciseUnavailable = !isExercisesLoading && !exercise;

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Torna al dettaglio del percorso"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.eyebrow}>CAPITOLO {chapterIndex + 1} DI {journey.chapters.length}</Text>
        <Text style={styles.title}>{chapter.title}</Text>
        <Text style={styles.description}>{chapter.description}</Text>

        <Card style={styles.coachingCard}>
          <Text style={styles.cardTitle}>Prenditi questo spazio</Text>
          <Text style={styles.cardText}>
            Segui la pratica con curiosità. Puoi fermarti in qualsiasi momento e riprendere quando ti senti pronto.
          </Text>
        </Card>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{chapter.durationMinutes} minuti</Text>
          <Text style={styles.meta}>{exercise?.name ?? 'Pratica non disponibile'}</Text>
        </View>

        {exerciseUnavailable ? (
          <Text style={styles.errorText} accessibilityLiveRegion="assertive">
            La pratica di questo capitolo non è disponibile. Riprova più tardi.
          </Text>
        ) : null}

        <Button
          label={isExercisesLoading || isSubscriptionLoading ? 'Caricamento…' : exerciseUnavailable ? 'Pratica non disponibile' : 'Inizia il capitolo'}
          onPress={startChapter}
          disabled={isExercisesLoading || isSubscriptionLoading || !exercise}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', padding: Spacing.sm, marginBottom: Spacing.xl },
  eyebrow: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, letterSpacing: 0.8 },
  title: { color: Colors.textPrimary, fontFamily: FontFamily.heading, fontSize: FontSize.xxxl, marginTop: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.lg, lineHeight: 28, marginTop: Spacing.md },
  coachingCard: { marginTop: Spacing.xl, backgroundColor: Colors.backgroundElevated },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginVertical: Spacing.xl },
  meta: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  errorText: { color: Colors.warning, fontSize: FontSize.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
