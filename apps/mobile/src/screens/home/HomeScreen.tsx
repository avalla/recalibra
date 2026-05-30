import React, { useMemo, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { Screen } from '../../components';
import { useAuth } from '../../contexts';
import { useSessions, useExercises, useSubscription } from '../../hooks';
import {
  getExerciseForQuickStart,
  loadQuickStartPreference,
  toExerciseSessionParams,
  type QuickStartPreference,
} from '../../utils/quick-start';
import type { ExerciseWithFavorite } from '../../types';
import { GREETING_PHRASES } from './home-constants';
import { getUserFirstName } from './home-helpers';
import { FeelingEntry, GreetingCard, HomeHeader } from './components';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userMetadata } = useAuth();
  const { sessions, refetch: refreshSessions } = useSessions();
  const { exercises } = useExercises();
  const { canAccessExercise } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [quickStartPreference, setQuickStartPreference] = useState<QuickStartPreference | null>(null);

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
      return () => {
        active = false;
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  const beginSession = (exercise: ExerciseWithFavorite, preStress: number) => {
    navigation.navigate('Main', {
      screen: 'ExercisesTab',
      params: {
        screen: 'ExerciseSession',
        params: { ...toExerciseSessionParams(exercise), preStressLevel: preStress },
      },
    });
  };

  const openCatalog = () => {
    navigation.navigate('Main', {
      screen: 'ExercisesTab',
      params: { screen: 'ExerciseCatalog' },
    });
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
    beginSession(exercise, lastStress ?? 5);
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

        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <FeelingEntry
            exercises={exercises}
            lastStress={lastStress}
            excludeIds={excludeIds}
            canAccess={(exercise) => canAccessExercise(exercise.slug)}
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
