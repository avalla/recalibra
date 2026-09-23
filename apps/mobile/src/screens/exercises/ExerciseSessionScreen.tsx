import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { GuidedCue, Screen } from '../../components';
import { useAudio, useHaptics, useSessions } from '../../hooks';
import { tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { createSystemSpeechService, createSilentSpeechService } from '../../utils/speech';
import { GuidedSessionRunner, type GuidedRunnerSnapshot } from '../../utils/guided-session-runner';
import type { AudioPresetKey } from '../../hooks/useAudio';
import type { GuidedPlan, RootStackParamList } from '../../types';

type SessionRouteProps = RouteProp<RootStackParamList, 'ExerciseSession'>;

function fallbackPlan(route: RootStackParamList['ExerciseSession']): GuidedPlan {
  return route.guidedPlan ?? {
    mode: 'manual',
    recommendedMode: 'manual',
    steps: (route.instructions ?? []).map((step) => ({
      id: `legacy-${step.step}`,
      instruction: step.instruction,
      actions: [{ type: 'show' as const, text: step.instruction }],
    })),
  };
}

export const ExerciseSessionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<SessionRouteProps>();
  const params = route.params;
  const { startSession } = useSessions();
  const { language } = useLanguage();
  const { light, medium, success } = useHaptics();
  const plan = useMemo(() => fallbackPlan(params), [params]);
  const effectivePlan = useMemo(() => ({ ...plan, mode: params.guidanceMode ?? plan.mode }), [plan, params.guidanceMode]);
  const audioEnabled = params.audioEnabled !== false;
  const speech = useMemo(() => audioEnabled ? createSystemSpeechService() : createSilentSpeechService(), [audioEnabled]);
  const speechRate = params.guidanceSpeed === 'slow' ? 0.8 : params.guidanceSpeed === 'fast' ? 1.15 : 1;
  const audioPreset = (params.audioPreset || 'silence') as AudioPresetKey;
  const { play: playAmbient, pause: pauseAmbient, stop: stopAmbient } = useAudio({ preset: audioPreset, volume: 0.32 });
  const runnerRef = useRef<GuidedSessionRunner | null>(null);
  const startedRef = useRef(false);
  const [snapshot, setSnapshot] = useState<GuidedRunnerSnapshot>(() => ({
    status: 'idle',
    stepIndex: 0,
    stepCount: effectivePlan.steps.length,
    instruction: effectivePlan.steps[0]?.instruction ?? '',
    visualCue: effectivePlan.steps[0]?.visualCue,
    elapsedMs: 0,
    completedStepIds: [],
  }));
  const sessionIdRef = useRef<string | null>(null);
  const pausedByLifecycleRef = useRef(false);
  const lifecyclePauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppStateRef = useRef(AppState.currentState);
  const hasObservedAppStateRef = useRef(false);
  const isAutomatic = effectivePlan.mode === 'automatic';

  const onComplete = useCallback((completed: GuidedRunnerSnapshot) => {
    void success();
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return;
    stopAmbient();
    navigation.replace('PostSession', {
      sessionId: activeSessionId,
      exerciseId: params.exerciseId,
      exerciseName: params.exerciseName,
      durationSeconds: Math.round(completed.elapsedMs / 1000),
      preStressLevel: params.preStressLevel ?? null,
      journeyContext: params.journeyContext,
    });
  }, [navigation, params.exerciseId, params.exerciseName, params.journeyContext, params.preStressLevel, stopAmbient, success]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let active = true;
    void startSession(params.exerciseId, params.preStressLevel ?? null).then((result) => {
      if (!active) return;
      if (result.error || !result.data) {
        Alert.alert(tr('Session not started'), tr('Your practice could not be started. Please try again.'));
        navigation.goBack();
        return;
      }
      sessionIdRef.current = result.data.id;
      const runner = new GuidedSessionRunner(effectivePlan, {
        speech,
        speechOptions: { rate: speechRate, language: language === 'en' ? 'en-US' : 'it-IT' },
        haptic: (pattern) => pattern === 'medium' ? medium() : light(),
        onChange: setSnapshot,
        onComplete,
      });
      runnerRef.current = runner;
      runner.start();
      if (audioEnabled && audioPreset !== 'silence') void playAmbient();
    }).catch(() => {
      if (!active) return;
      Alert.alert(tr('Session not started'), tr('Your practice could not be started. Please try again.'));
      navigation.goBack();
    });
    return () => {
      active = false;
      runnerRef.current?.abort();
      stopAmbient();
    };
  }, [audioEnabled, audioPreset, effectivePlan, light, medium, navigation, onComplete, params.exerciseId, params.preStressLevel, playAmbient, speech, speechRate, startSession, stopAmbient, language]);

  useEffect(() => {
    const interval = setInterval(() => {
      const runner = runnerRef.current;
      if (runner && runner.snapshot().status === 'running') setSnapshot(runner.snapshot());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const runner = runnerRef.current;
      const previousState = lastAppStateRef.current;
      lastAppStateRef.current = state;

      // The first notification can describe the navigation transition that
      // created this screen rather than the user leaving the app.
      if (!hasObservedAppStateRef.current) {
        hasObservedAppStateRef.current = true;
        return;
      }

      if (state === 'background') {
        // Only Android backgrounding should pause a session. The transient
        // inactive state can occur during navigation and must not stop playback.
        if (previousState !== 'active') return;
        if (lifecyclePauseTimerRef.current !== null) clearTimeout(lifecyclePauseTimerRef.current);
        lifecyclePauseTimerRef.current = setTimeout(() => {
          lifecyclePauseTimerRef.current = null;
          const currentRunner = runnerRef.current;
          if (AppState.currentState !== 'active' && currentRunner?.snapshot().status === 'running') {
            pausedByLifecycleRef.current = true;
            currentRunner.pause();
            pauseAmbient();
          }
        }, 500);
        return;
      }
      if (state !== 'active') return;

      if (lifecyclePauseTimerRef.current !== null) {
        clearTimeout(lifecyclePauseTimerRef.current);
        lifecyclePauseTimerRef.current = null;
      }

      // Resume only pauses caused by a real lifecycle transition; an intentional
      // user pause must remain paused.
      if (pausedByLifecycleRef.current && runner?.snapshot().status === 'paused') {
        pausedByLifecycleRef.current = false;
        runner.resume();
        if (audioEnabled && audioPreset !== 'silence') void playAmbient();
      }
    });
    return () => {
      subscription.remove();
      if (lifecyclePauseTimerRef.current !== null) clearTimeout(lifecyclePauseTimerRef.current);
    };
  }, [audioEnabled, audioPreset, pauseAmbient, playAmbient]);

  useEffect(() => navigation.addListener('beforeRemove', () => {
    runnerRef.current?.abort();
    stopAmbient();
  }), [navigation, stopAmbient]);

  const togglePause = () => {
    const runner = runnerRef.current;
    if (!runner) return;
    if (snapshot.status === 'paused') {
      runner.resume();
      if (audioEnabled && audioPreset !== 'silence') void playAmbient();
    } else if (snapshot.status === 'running') {
      runner.pause();
      pauseAmbient();
    }
  };

  const endSession = () => {
    Alert.alert(tr('End session?'), tr('Your progress will not be marked as completed.'), [
      { text: tr('Cancel'), style: 'cancel' },
      { text: tr('End'), style: 'destructive', onPress: () => { runnerRef.current?.abort(); stopAmbient(); navigation.goBack(); } },
    ]);
  };

  if (snapshot.status === 'completed') return null;

  return (
    <Screen style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={endSession} accessibilityRole="button" accessibilityLabel={tr('End session')}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{params.exerciseName}</Text>
          <Text style={styles.stepCount}>{snapshot.stepIndex + 1} {tr('of')} {snapshot.stepCount}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <GuidedCue cue={snapshot.visualCue} instruction={snapshot.instruction} />
        <Text style={styles.instruction} accessibilityRole="text">{snapshot.instruction}</Text>
        {snapshot.status === 'idle' ? <Text style={styles.starting}>{tr('Starting session...')}</Text> : null}
        <Text style={styles.elapsed}>{formatElapsed(snapshot.elapsedMs)}</Text>

        {snapshot.status === 'paused' ? (
          <View style={styles.pausedPanel}>
            <Text style={styles.pausedTitle}>{tr('Paused')}</Text>
            <Text style={styles.pausedText}>{tr('Take your time. The session timer is paused.')}</Text>
            <View style={styles.secondaryRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => runnerRef.current?.repeatCurrentStep()} accessibilityRole="button" accessibilityLabel={tr('Repeat current step')}>
                <Ionicons name="refresh" size={17} color={Colors.primary} /><Text style={styles.secondaryText}>{tr('Repeat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => runnerRef.current?.skipCurrentStep()} accessibilityRole="button" accessibilityLabel={tr('Skip current step')}>
                <Ionicons name="play-skip-forward" size={17} color={Colors.primary} /><Text style={styles.secondaryText}>{tr('Skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {!isAutomatic && snapshot.status === 'running' ? (
          <TouchableOpacity style={styles.manualNext} onPress={() => runnerRef.current?.next()} accessibilityRole="button" accessibilityLabel={tr('Next step')}>
            <Text style={styles.manualNextText}>{snapshot.stepIndex + 1 === snapshot.stepCount ? tr('Finish step') : tr('Next step')}</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.background} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={togglePause}
          disabled={snapshot.status === 'idle'}
          accessibilityRole="button"
          accessibilityLabel={snapshot.status === 'paused' ? tr('Resume practice') : tr('Pause practice')}
          accessibilityState={{ disabled: snapshot.status === 'idle' }}
        >
          <Ionicons name={snapshot.status === 'paused' ? 'play' : 'pause'} size={22} color={Colors.background} />
          <Text style={styles.pauseText}>{snapshot.status === 'paused' ? tr('Resume') : tr('Pause')}</Text>
        </TouchableOpacity>
        {snapshot.status === 'paused' ? <TouchableOpacity style={styles.endLink} onPress={endSession} accessibilityRole="button"><Text style={styles.endLinkText}>{tr('End session')}</Text></TouchableOpacity> : null}
      </View>
    </Screen>
  );
};

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  stepCount: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  instruction: { color: Colors.textPrimary, fontSize: FontSize.xl, lineHeight: 31, textAlign: 'center', fontWeight: FontWeight.semibold },
  starting: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  elapsed: { color: Colors.textMuted, fontSize: FontSize.sm },
  pausedPanel: { width: '100%', padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundCard, gap: Spacing.xs },
  pausedTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, textAlign: 'center' },
  pausedText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
  secondaryRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundElevated, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.xs },
  secondaryText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  manualNext: { minHeight: 52, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm },
  manualNextText: { color: Colors.background, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  pauseButton: { minHeight: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  pauseText: { color: Colors.background, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  endLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  endLinkText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
