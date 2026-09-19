import React, { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { Screen } from '../../components';
import { useAuth } from '../../contexts';
import { useSessions, useExercises } from '../../hooks';
import { getJourneyProgress } from '../../db';
import { journeys } from '../../data/journeys';
import { getJourneyDurationMinutes } from '../../utils/journey-ui';
import {
  getExerciseForQuickStart,
  loadQuickStartPreference,
  toExerciseSessionParams,
  type QuickStartPreference,
} from '../../utils/quick-start';
import type { ExerciseWithFavorite } from '../../types';
import { GREETING_PHRASES } from './home-constants';
import { getUserFirstName } from './home-helpers';
import { FeelingEntry, GreetingCard, HomeHeader, JourneyCard } from './components';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userMetadata } = useAuth();
  const { sessions, refetch: refreshSessions } = useSessions();
  const { exercises, isLoading } = useExercises();
  const [refreshing, setRefreshing] = useState(false);
  const [quickStartPreference, setQuickStartPreference] = useState<QuickStartPreference | null>(null);
  const [journeyProgress, setJourneyProgress] = useState<Awaited<ReturnType<typeof getJourneyProgress>>>(null);
  const featuredJourney = journeys[0];

  const userName = getUserFirstName(userMetadata?.full_name);

  const greetingPhrase = useMemo(
    () => GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)],
    []
  );

  const lastSession = sessions[0];
  const lastStress =
    (lastSession as any)?.post_stress_level ?? (lastSession as any)?.pre_stress_level;
  const excludeIds = useMemo(
    () => (lastSession?.exercise_id ? [lastSession.exercise_id] : []),
    [lastSession?.exercise_id]
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      loadQuickStartPreference().then((pref) => {
        if (active) setQuickStartPreference(pref);
      });
      if (featuredJourney) {
        getJourneyProgress(featuredJourney.id).then((nextProgress) => {
          if (active) setJourneyProgress(nextProgress);
        });
      }
      return () => {
        active = false;
      };
    }, [featuredJourney])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  const beginSession = (exercise: ExerciseWithFavorite) => {
    // ExerciseSession lives on the root stack, not inside the Exercises tab.
    // navigate() bubbles up from the tab to find it (same as ExerciseDetailScreen).
    navigation.navigate('ExerciseSession', {
      ...toExerciseSessionParams(exercise),
    });
  };

  const openCatalog = () => {
    navigation.navigate('Main', {
      screen: 'ExercisesTab',
      params: { screen: 'ExerciseCatalog' },
    });
  };

  const openJourney = () => {
    if (featuredJourney) navigation.navigate('JourneyDetail', { journeyId: featuredJourney.id });
  };

  // Header quick-start button: repeat the user's preferred quick practice.
  const handleQuickStart = () => {
    if (!quickStartPreference) {
      navigation.navigate('QuickStartPreferences', { from: 'home' });
      return;
    }
    const exercise = getExerciseForQuickStart(quickStartPreference, exercises, {
      now: new Date(),
      lastStressLevel: lastStress,
    });
    if (!exercise) {
      navigation.navigate('QuickStartPreferences', { from: 'home' });
      return;
    }
    beginSession(exercise);
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <HomeHeader onQuickStartPress={handleQuickStart} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <GreetingCard userName={userName} greetingPhrase={greetingPhrase} />
        </Animated.View>

        {featuredJourney ? (
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <JourneyCard
              journey={featuredJourney}
              progress={journeyProgress}
              durationMinutes={getJourneyDurationMinutes(featuredJourney, exercises)}
              onPress={openJourney}
            />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <FeelingEntry
            exercises={exercises}
            lastStress={lastStress}
            excludeIds={excludeIds}
            loading={isLoading}
            onBegin={beginSession}
            onBrowse={openCatalog}
          />
        </Animated.View>
      </ScrollView>
    </Screen>
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
    paddingBottom: Spacing.xl,
  },
  journeyCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
  },
  journeyEyebrow: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.8,
  },
  journeyTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    marginTop: Spacing.xs,
  },
  journeyDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FontFamily.regular,
  },
});
