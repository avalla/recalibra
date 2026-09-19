import { formatMinutes, formatNumber } from '../../i18n/core';
import { enumLabel } from '../../i18n/labels';
import { tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { exerciseText } from '../../i18n/exercises';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StressRating } from '../../components/StressRating';
import { isStressRating } from '../../utils/stress-rating';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated, 
  ScrollView,
  useWindowDimensions,
  AccessibilityInfo,
  Modal,
  findNodeHandle,
  Alert,
  AppState
 } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useSessions, useAudio, getAudioRecommendation, useHaptics } from '../../hooks';
import type { AudioPresetKey, ExerciseCategory } from '../../hooks';
import type { RootStackParamList, BreathingPattern } from '../../types';
import { buildCycleSegments, createPracticeClock, formatPhaseRemaining, getBreathFrame, interruptPractice, usesTimedBreathing, type BreathingPhase, type PracticeState } from '../../utils/practice-timing';
import { Screen } from '../../components';
import { BreathingGraph, type GraphCurvePreset } from '../../components/BreathingGraph';
import { TutorialOverlay } from '../../components/TutorialOverlay';
import { OriginIcon } from '../../components/OriginIcon';
import { AUDIO_OPTIONS, type AudioOption, AudioSelector } from '../../components/AudioSelector';
import {
  loadBreathingVisualizationMode,
  loadBreathingCurvePresetOverride,
  saveBreathingVisualizationMode,
  saveBreathingCurvePresetOverride,
  type BreathingCurvePresetOverride,
  type BreathingVisualizationMode,
} from '../../utils/breath-visualization';


const BOTTOM_BAR_HEIGHT = 88;

// Default pattern: 4-7-8 breathing
const DEFAULT_PATTERN: BreathingPattern = {
  inhale: 4,
  hold: 7,
  exhale: 8,
  rest: 0,
};

type SessionRouteProps = RouteProp<RootStackParamList, 'ExerciseSession'>;

type PhasePalette = {
  inhale: string;
  hold: string;
  exhale: string;
  rest: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function getPhaseTypePalette(): PhasePalette {
  // Calm teal progression. Phases are not states, so they don't borrow the
  // semantic warning/success colors (amber on a hold read like a problem).
  return {
    inhale: Colors.primary,
    hold: Colors.primaryLight,
    exhale: Colors.primaryDark,
    rest: Colors.textSecondary,
  };
}

function getPhaseColor(phase: BreathingPhase, palette: PhasePalette): string {
  switch (phase) {
    case 'inhale':
    case 'inhale2':
      return palette.inhale;
    case 'hold':
    case 'retention':
      return palette.hold;
    case 'exhale':
      return palette.exhale;
    case 'rest':
      return palette.rest;
    default:
      return palette.inhale;
  }
}

export const ExerciseSessionScreen: React.FC = () => {
  const { language } = useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<SessionRouteProps>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const CIRCLE_SIZE = Math.max(140, Math.min(width * 0.68, height * 0.30, 300));
  const GRAPH_HEIGHT = Math.min(220, CIRCLE_SIZE * 0.65);
  const [reduceMotion, setReduceMotion] = useState(true);
  const infoButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const infoHeadingRef = useRef<React.ElementRef<typeof Text>>(null);
  
  const {
    exerciseId,
    exerciseName: canonicalName,
    durationMinutes,
    audioPreset,
    exerciseCategory,
    breathingPattern: routePattern,
    origin: dbOrigin,
    history: canonicalHistory,
    benefits: canonicalBenefits,
    tips: canonicalTips,
    instructions: canonicalInstructions,
    safetyWarning: canonicalWarning,
    journeyContext,
  } = route.params;
  const localizedText = useMemo(() => exerciseText(exerciseId, {
    name: canonicalName, history: canonicalHistory, benefits: canonicalBenefits,
    tips: canonicalTips, instructions: canonicalInstructions, safety_warning: canonicalWarning,
  }, language), [exerciseId, canonicalName, canonicalHistory, canonicalBenefits, canonicalTips, canonicalInstructions, canonicalWarning, language]);
  const { name: exerciseName = canonicalName, history: dbHistory, benefits: dbBenefits,
    tips: dbTips, instructions: dbInstructions, safety_warning: safetyWarning } = localizedText;
  const { startSession, updateSessionStatus } = useSessions();
  const {
    breathingPhase: hapticBreathingPhase,
    success: hapticSuccess,
    medium: hapticMedium,
    selection: hapticSelection,
  } = useHaptics();

  // Use pattern from database or fallback to default
  const pattern: BreathingPattern = routePattern || DEFAULT_PATTERN;

  // Only protocols fully represented by the pattern receive a timed visual guide.
  const isBreathingExercise = usesTimedBreathing(exerciseCategory, routePattern);
  const [instructionIndex, setInstructionIndex] = useState(0);

  // Use data from database, fallback to defaults
  const exerciseInfo = {
    origin: dbOrigin ? enumLabel(dbOrigin) : tr('Exercise'),
    originKey: dbOrigin?.toLowerCase() || 'universal',
    history: dbHistory || '',
    benefits: dbBenefits || [],
  };

  // Default steps and tips if not in database
  const defaultSteps = [tr("Read the exercise instructions before starting.")];
  const defaultTips: string[] = [];

  const exerciseSteps =
    dbInstructions?.length ? dbInstructions.map((i: { instruction: string }) => i.instruction) : defaultSteps;
  const exerciseTips = dbTips || defaultTips;

  // Audio selection state - user can override the default from exercise
  const [selectedAudioId, setSelectedAudioId] = useState<AudioPresetKey>(() => {
    if (!audioPreset) return 'silence';
    const isValidPreset = AUDIO_OPTIONS.some((option: AudioOption) => option.id === audioPreset);
    if (!isValidPreset) return 'silence';
    return audioPreset as AudioPresetKey;
  });
  const [audioRecommendation, setAudioRecommendation] = useState<{
    primary: AudioPresetKey;
    reason: string;
  } | null>(null);

  // Audio hook - use the user-selected audio
  const audioPresetKey = selectedAudioId;

  const [audioVolume, setAudioVolume] = useState(0.7);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [breathingVisualizationMode, setBreathingVisualizationMode] = useState<BreathingVisualizationMode>('circle');
  const [curvePresetOverride, setCurvePresetOverride] = useState<BreathingCurvePresetOverride>('auto');

  // Onboarding state
  const [currentPage, setCurrentPage] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  // Avoids a one-frame flash of the onboarding for users who have already seen
  // it: we don't render the body until the persisted status has been read.
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const onboardingPages = useMemo(() => {
    const pages: Array<Record<string, any>> = [
      {
        title: tr("Welcome to {{name}}", { name: exerciseName }),
        subtitle: tr("Prepare for your practice"),
        description:
          isBreathingExercise ? tr("Follow the timed breathing guide during your practice.") : tr("Follow the instructions at your own pace. Advance each step when you are ready."),
        icon: 'leaf-outline',
      },
      {
        title: tr("Benefits"),
        subtitle: tr("What you'll experience"),
        description: exerciseInfo.benefits
          .map((benefit: string, index: number) => `${index + 1}. ${benefit}`)
          .join('\n'),
        icon: 'heart-outline',
      },
      {
        title: tr("Getting Ready"),
        subtitle: tr("Find a comfortable position"),
        description:
          tr("Read the instructions and any warnings below. Prepare the space and position described for this exercise."),
        icon: 'checkmark-circle-outline',
      },
      {
        title: tr("Breathing Pattern"),
        subtitle: tr("Your rhythm for this session"),
        customContent: 'breathingPattern',
        icon: 'time-outline',
      },
      {
        title: exerciseInfo.origin,
        subtitle: tr("A short story behind this practice"),
        customContent: 'originStory',
        icon: 'compass-outline',
      },
    ];

    exerciseSteps.forEach((step: string, index: number) => {
      pages.push({
        title: tr("Step {{step}}", { step: index + 1 }),
        subtitle: tr("Follow along"),
        customContent: 'singleStep',
        payload: { text: step },
        icon: 'list-outline',
      });
    });

    if (exerciseTips.length > 0) {
      pages.push({
        title: tr("Tips"),
        subtitle: tr("Small details that help"),
        customContent: 'tipsList',
        icon: 'bulb-outline',
      });
    }

    return pages.filter((page) => (isBreathingExercise || page.customContent !== 'breathingPattern') && (exerciseInfo.history || page.customContent !== 'originStory') && (exerciseInfo.benefits.length || page.title !== 'Benefits'));
  }, [exerciseName, exerciseInfo.benefits, exerciseInfo.history, exerciseInfo.origin, exerciseSteps, exerciseTips, isBreathingExercise]);

  const handleNextPage = async () => {
    if (currentPage < onboardingPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      // Mark onboarding as seen for this exercise
      await AsyncStorage.setItem(`onboarding_${exerciseId}`, 'seen');
      setShowOnboarding(false);
      setPreSessionStep(2);
    }
  };

  const handleSkipOnboarding = async () => {
    // Mark onboarding as seen for this exercise
    await AsyncStorage.setItem(`onboarding_${exerciseId}`, 'seen');
    setShowOnboarding(false);
  };

  // Render custom content for onboarding pages
  const renderCustomContent = () => {
    const currentPageData = onboardingPages[currentPage];
    if (!currentPageData) return null;
    
    switch (currentPageData.customContent) {
      case 'breathingPattern':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons 
              name={currentPageData.icon as any} 
              size={60} 
              color={Colors.primary} 
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>
              {currentPageData.title}
            </Text>
            <Text style={styles.onboardingSubtitle}>
              {currentPageData.subtitle}
            </Text>
            
            {/* Breathing Pattern Preview */}
            <View style={styles.patternPreview}>
              <View style={styles.patternCircle}>
                <Animated.View
                  style={[
                    styles.patternInnerCircle,
                    {
                      transform: [
                        {
                          scale: 1,
                        },
                      ],
                    },
                  ]}
                />
                <Text style={styles.patternText}>{pattern.inhale}-{pattern.hold}-{pattern.exhale}</Text>
              </View>
              <View style={styles.patternIndicators}>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>{tr("Inhale")}</Text>
                  <Text style={styles.indicatorTime}>{pattern.inhale}{tr("s")}</Text>
                </View>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>{tr("Hold")}</Text>
                  <Text style={styles.indicatorTime}>{pattern.hold}{tr("s")}</Text>
                </View>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>{tr("Exhale")}</Text>
                  <Text style={styles.indicatorTime}>{pattern.exhale}{tr("s")}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'originStory':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons
              name={currentPageData.icon as any}
              size={60}
              color={Colors.primary}
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>{currentPageData.title}</Text>
            <Text style={styles.onboardingSubtitle}>{currentPageData.subtitle}</Text>
            <Text style={styles.onboardingDescription}>{exerciseInfo.history}</Text>
          </View>
        );
        
      case 'singleStep':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons 
              name={currentPageData.icon as any} 
              size={60} 
              color={Colors.primary} 
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>
              {currentPageData.title}
            </Text>
            <Text style={styles.onboardingSubtitle}>
              {currentPageData.subtitle}
            </Text>

            <View style={styles.stepItem}>
              <Text style={styles.stepText}>{currentPageData.payload?.text}</Text>
            </View>
          </View>
        );
        
      case 'singleTip':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons 
              name={currentPageData.icon as any} 
              size={60} 
              color={Colors.primary} 
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>
              {currentPageData.title}
            </Text>
            <Text style={styles.onboardingSubtitle}>
              {currentPageData.subtitle}
            </Text>

            <View style={styles.tipItem}>
              <Ionicons name="bulb" size={20} color="#FFA500" style={styles.tipItemIcon} />
              <Text style={styles.tipItemText}>{currentPageData.payload?.text}</Text>
            </View>
          </View>
        );

      case 'tipsList':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons
              name={currentPageData.icon as any}
              size={60}
              color={Colors.primary}
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>{currentPageData.title}</Text>
            <Text style={styles.onboardingSubtitle}>{currentPageData.subtitle}</Text>

            <View style={styles.setupScroll}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.tipsListScroll}
                contentContainerStyle={styles.tipsListContent}
              >
                {exerciseTips.map((tip: string, index: number) => (
                  <View key={`${index}-${tip}`} style={styles.tipItem}>
                    <Ionicons name="bulb" size={20} color="#FFA500" style={styles.tipItemIcon} />
                    <Text style={styles.tipItemText}>{tip}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );
        
      case 'startSession':
        return (
          <View style={styles.customContentContainer}>
            <Ionicons 
              name={currentPageData.icon as any} 
              size={60} 
              color={Colors.primary} 
              style={styles.customContentIcon}
            />
            <Text style={styles.onboardingTitle}>
              {currentPageData.title}
            </Text>
            <Text style={styles.onboardingSubtitle}>
              {currentPageData.subtitle}
            </Text>
            
            {/* Exercise Info */}
            <View style={styles.sessionInfo}>
              <View style={styles.originDurationRow}>
                <View style={styles.originBadge}>
                  <OriginIcon origin={exerciseInfo.originKey} size={20} />
                  <Text style={styles.originLabel}>{exerciseInfo.origin}</Text>
                </View>
                <View style={styles.dividerDot} />
                <View style={styles.durationBadgeMinimal}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.durationLabel}>{durationMinutes} {tr("min")}</Text>
                </View>
              </View>
            </View>

            {/* Stress Level Selector */}
            <Text style={styles.stressQuestion}>{tr("How are you feeling now?")}</Text>
            <StressRating value={preStressLevel} onChange={handleStressLevelChange} />
            <Text style={styles.stressHint}>{tr("This helps personalize your session")}</Text>

            {/* Audio Selector */}
            <AudioSelector
              selectedAudioId={selectedAudioId}
              onSelect={setSelectedAudioId}
              recommendedId={audioRecommendation?.primary}
            />
          </View>
        );
        
      default:
        return null;
    }
  };

  const { play: playAudio, stop: stopAudio, pause: pauseAudio, setVolume, presetInfo } = useAudio({
    preset: audioPresetKey,
    volume: audioVolume,
    loop: true
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preStressLevel, setPreStressLevel] = useState<number | null>(null);
  const [preSessionStep, setPreSessionStep] = useState<1 | 2 | 3>(1);
  const [sessionState, setSessionState] = useState<PracticeState>('stress_prompt');
  const [showTutorial, setShowTutorial] = useState(false);


  const activeOnboardingPage = onboardingPages[currentPage];

  // Check if tutorial should be shown
  useEffect(() => {
    const checkTutorialStatus = async () => {
      const tutorialSeen = await AsyncStorage.getItem('tutorial_seen');
      if (!tutorialSeen) {
        setShowTutorial(true);
      }
    };
    checkTutorialStatus();
  }, []);

  const toggleVisualizationMode = async () => {
    const nextMode: BreathingVisualizationMode =
      breathingVisualizationMode === 'graph' ? 'circle' : 'graph';
    setBreathingVisualizationMode(nextMode);
    await saveBreathingVisualizationMode(nextMode);
  };

  // Check if onboarding should be shown for this exercise
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingSeen = await AsyncStorage.getItem(`onboarding_${exerciseId}`);
        if (onboardingSeen) {
          setShowOnboarding(false);
        }
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboardingStatus();
  }, [exerciseId]);

  // Update audio recommendation when stress level changes
  const handleStressLevelChange = (level: number) => {
    hapticSelection();
    setPreStressLevel(level);

    if (exerciseCategory) {
      const recommendation = getAudioRecommendation(exerciseCategory as ExerciseCategory, level);
      setAudioRecommendation({
        primary: recommendation.primary,
        reason: recommendation.reason,
      });
      // Auto-select the recommended audio
      setSelectedAudioId(recommendation.primary);
    }
  };

  // Initialize recommendation on mount
  useEffect(() => {
    if (exerciseCategory) {
      const recommendation = getAudioRecommendation(exerciseCategory as ExerciseCategory, preStressLevel ?? 5);
      setAudioRecommendation({
        primary: recommendation.primary,
        reason: recommendation.reason,
      });
      // Set recommended audio as default if no preset was specified
      if (!audioPreset || audioPreset === 'silence') {
        setSelectedAudioId(recommendation.primary);
      }
    }
  }, []);
  const [countdownValue, setCountdownValue] = useState(3);
  const [activeElapsedMs, setActiveElapsedMs] = useState(0);
  const sessionDuration = durationMinutes * 60;
  const elapsedTime = Math.min(sessionDuration, Math.floor(activeElapsedMs / 1000));
  const clock = useRef(createPracticeClock()).current;
  const stateRef = useRef(sessionState);
  stateRef.current = sessionState;
  const isPlaying = sessionState === 'playing';
  const cycleSegments = useMemo(() => buildCycleSegments(pattern), [pattern]);
  const frame = getBreathFrame(cycleSegments.length ? cycleSegments : buildCycleSegments(DEFAULT_PATTERN), activeElapsedMs);
  const currentPhase = frame.phase;
  const smoothPhaseProgress = frame.phaseProgress;
  const activeSegmentIndex = frame.activeSegmentIndex;
  const cycleProgress = frame.cycleProgress;
  const cycleTotalSeconds = cycleSegments.reduce((sum, segment) => sum + segment.duration, 0) || 1;
  const pausePractice = useCallback(() => {
    clock.pause();
    setActiveElapsedMs(clock.elapsed());
    pauseAudio();
    stateRef.current = interruptPractice(stateRef.current);
    setSessionState(stateRef.current);
  }, [clock, pauseAudio]);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; sub.remove(); };
  }, []);

  useEffect(() => {
    if (!isPlaying || AppState.currentState !== 'active') { clock.pause(); return; }
    clock.resume();
    let id = 0;
    const tick = () => {
      if (AppState.currentState !== 'active' || stateRef.current !== 'playing') { pausePractice(); return; }
      setActiveElapsedMs(clock.elapsed());
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(id); clock.pause(); };
  }, [isPlaying, clock, pausePractice]);

  const lastHapticTransition = useRef(-1);
  useEffect(() => {
    if (!isPlaying || !isBreathingExercise || lastHapticTransition.current === frame.transition) return;
    lastHapticTransition.current = frame.transition;
    hapticBreathingPhase();
  }, [isPlaying, isBreathingExercise, frame.transition, hapticBreathingPhase]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pausePractice();
    });
    return () => sub.remove();
  }, [pausePractice]);

  useEffect(() => navigation.addListener('beforeRemove', () => {
    clock.pause();
    stopAudio();
  }), [navigation, clock, stopAudio]);

  // Get label for current phase (with special pattern support)
  const getPhaseLabel = (phase: BreathingPhase): string => {
    // Special labels based on pattern type
    if (pattern.special === 'humming' && phase === 'exhale') {
      return tr("Hum ");
    }
    if (pattern.special === 'roar' && phase === 'exhale') {
      return tr("Roar ");
    }
    if (pattern.special === 'ha_sound' && phase === 'exhale') {
      return tr("HA! ");
    }

    switch (phase) {
      case 'inhale':
        return tr("Inhale");
      case 'inhale2':
        return tr("Inhale +"); // Second inhale for physiological sigh
      case 'hold':
        return tr("Hold");
      case 'exhale':
        return tr("Exhale");
      case 'rest':
        return tr("Rest");
      case 'retention':
        return tr("Hold Empty"); // For Wim Hof retention
      default:
        return tr("Breathe");
    }
  };

  const getPhaseCoachLine = (phase: BreathingPhase): string => {
    if (pattern.special === 'humming' && phase === 'exhale') {
      return tr("Exhale with a gentle hum.");
    }
    if (pattern.special === 'roar' && phase === 'exhale') {
      return tr("Exhale with a relaxed roar.");
    }
    if (pattern.special === 'ha_sound' && phase === 'exhale') {
      return tr("Exhale and let out a soft “HA”.");
    }
    if (pattern.special === 'double_inhale') {
      if (phase === 'inhale') return tr("Inhale gently through the nose.");
      if (phase === 'inhale2') return tr("Top up with a quick sip of air.");
      if (phase === 'exhale') return tr("Long, slow exhale.");
      if (phase === 'rest') return tr("Pause and relax your shoulders.");
    }
    if (pattern.special === 'wim_hof') {
      if (phase === 'inhale') return tr("Deep inhale into the belly and chest.");
      if (phase === 'exhale') return tr("Let it go (no force).");
      if (phase === 'retention') return tr("Hold after exhale. Stay relaxed.");
    }

    switch (phase) {
      case 'inhale':
        return tr("Inhale slowly through the nose.");
      case 'inhale2':
        return tr("A second, smaller inhale.");
      case 'hold':
        return tr("Stay still. Soften your face.");
      case 'exhale':
        return tr("Exhale gently and fully.");
      case 'rest':
        return tr("Rest. Let the breath settle.");
      case 'retention':
        return tr("Hold on empty. Stay calm.");
      default:
        return tr("Follow the circle.");
    }
  };

  // Handle session completion
  useEffect(() => {
    if (elapsedTime >= sessionDuration && sessionId && sessionState === 'playing' && isStressRating(preStressLevel)) {
      clock.pause();
      setSessionState('paused');
      stopAudio();
      // Haptic feedback for session completion
      hapticSuccess();
      navigation.replace('PostSession', {
        sessionId,
        exerciseId,
        exerciseName,
        durationSeconds: elapsedTime,
        preStressLevel,
        journeyContext,
      });
    }
  }, [elapsedTime, sessionDuration, sessionId, sessionState, journeyContext]);

  // Countdown timer
  useEffect(() => {
    if (sessionState !== 'countdown') return;
    if (AppState.currentState !== 'active') { pausePractice(); return; }

    if (countdownValue === 0) {
      setSessionState('playing');
      // Start audio
      if (audioPresetKey !== 'silence') {
        playAudio();
      }
      return;
    }

    const timer = setTimeout(() => {
      if (AppState.currentState !== 'active' || stateRef.current !== 'countdown') { pausePractice(); return; }
      setCountdownValue((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionState, countdownValue, audioPresetKey, playAudio, pausePractice]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [isStartingSession, setIsStartingSession] = useState(false);
  const startingSessionRef = useRef(false);

  const handleStartSession = async () => {
    if (startingSessionRef.current) return;
    if (!isStressRating(preStressLevel)) {
      setPreSessionStep(2);
      Alert.alert(tr("Choose your stress level"), tr("Select how stressed you feel before starting this practice."));
      return;
    }
    if (!exerciseId) {
      Alert.alert(tr("Error"), tr("Missing exercise id. Please go back and try again."));
      return;
    }

    startingSessionRef.current = true;
    setIsStartingSession(true);
    try {
      // Start the session
      const { data: sessionData, error } = await startSession(exerciseId, preStressLevel, {
        name: exerciseName,
        category: exerciseCategory,
        durationMinutes,
      });
      if (error) {
        console.error('[ExerciseSessionScreen] Failed to start session:', error);
        Alert.alert(tr("Error"), tr("Failed to start session. Please try again."));
        return;
      }

      if (!sessionData) {
        console.error('[ExerciseSessionScreen] Failed to start session: empty response');
        Alert.alert(tr("Error"), tr("Failed to start session. Please try again."));
        return;
      }

      setSessionId(sessionData.id);
      // Start countdown
      setCountdownValue(3);
      setSessionState(AppState.currentState === 'active' ? 'countdown' : 'countdown_paused');
    } catch (error) {
      console.error('[ExerciseSessionScreen] Unexpected startSession error:', error);
      Alert.alert(
        tr("Error"),
        tr("Failed to start session. Please try again.")
      );
    } finally {
      startingSessionRef.current = false;
      setIsStartingSession(false);
    }
  };

  const handlePlayPause = async () => {
    if (sessionState === 'stress_prompt') {
      handleStartSession();
    } else if (sessionState === 'playing' || sessionState === 'countdown') {
      pausePractice();
    } else if (AppState.currentState === 'active') {
      if (sessionState === 'countdown_paused') {
        setSessionState('countdown');
      } else {
        setSessionState('playing');
        playAudio();
      }
    }
  };

  const openExerciseInfo = () => {
    pausePractice();
    setShowExerciseInfo(true);
  };
  const closeExerciseInfo = () => {
    setShowExerciseInfo(false);
    requestAnimationFrame(() => { const node = findNodeHandle(infoButtonRef.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); });
  };
  const focusInfoButton = () => {
    const node = findNodeHandle(infoButtonRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  };

  const handleClose = async () => {
    // Interrupt countdown and clock before awaiting the database write.
    pausePractice();
    await stopAudio();

    // Mark session as abandoned if it was started
    if (sessionId && sessionState !== 'stress_prompt') {
      await updateSessionStatus(sessionId, 'abandoned', elapsedTime);
    }

    navigation.goBack();
  };

  const handleHeaderLeft = async () => {
    if (sessionState === 'stress_prompt' && preSessionStep > 1) {
      setPreSessionStep((prev) => (prev - 1) as 1 | 2 | 3);
      return;
    }

    await handleClose();
  };

  const headerTitle = useMemo(() => {
    if (sessionState !== 'stress_prompt') return exerciseName;
    if (preSessionStep === 1) return exerciseName;
    if (preSessionStep === 2) return tr("Before we start");
    return tr("Audio");
  }, [exerciseName, preSessionStep, sessionState, language]);

  const headerSubtitle = useMemo(() => {
    if (sessionState !== 'stress_prompt') return `${exerciseInfo.origin} · ${formatMinutes(durationMinutes)}`;
    if (preSessionStep === 1) return `${exerciseInfo.origin} · ${formatMinutes(durationMinutes)}`;
    if (preSessionStep === 2) return tr("How stressed do you feel right now?");
    return tr("Choose a background sound");
  }, [durationMinutes, exerciseInfo.origin, preSessionStep, sessionState, language]);

  const progress = elapsedTime / sessionDuration;

  const handleVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
    setVolume(newVolume);
  };

  const volumeLevels = [0, 0.25, 0.5, 0.75, 1];

  const bottomBarPaddingBottom = Math.max(insets.bottom, Spacing.sm);
  const [measuredBottomBarHeight, setMeasuredBottomBarHeight] = useState(BOTTOM_BAR_HEIGHT);
  const bottomBarHeight = measuredBottomBarHeight;
  const onboardingContentPaddingBottom = 140 + insets.bottom;
  const onboardingFooterPaddingBottom = Spacing.lg + insets.bottom;

  const nextPhase = frame.nextPhase;
  const nowLabel = getPhaseLabel(currentPhase);
  const nextLabel = getPhaseLabel(nextPhase);
  const nowCoachLine = getPhaseCoachLine(currentPhase);
  const phasePalette = useMemo(() => getPhaseTypePalette(), []);
  const activePhaseColor = getPhaseColor(currentPhase, phasePalette);
  const phaseColor = activePhaseColor;
  const curvePreset = useMemo<GraphCurvePreset>(() => {
    if (preStressLevel !== null && preStressLevel >= 7) return 'energy';
    if (preStressLevel !== null && preStressLevel <= 3) return 'relax';
    return 'default';
  }, [preStressLevel]);

  const resolvedCurvePreset = useMemo<GraphCurvePreset>(() => {
    if (curvePresetOverride === 'auto') return curvePreset;
    return curvePresetOverride;
  }, [curvePreset, curvePresetOverride]);

  const announcedPhase = isBreathingExercise ? nowLabel : '';
  useEffect(() => {
    if (showExerciseInfo || AppState.currentState !== 'active' || sessionState === 'stress_prompt') return;
    const message = sessionState === 'paused' ? tr("Practice paused") : sessionState === 'countdown_paused' ? tr("Countdown paused") : sessionState === 'countdown' ? tr("Get ready") : isBreathingExercise ? nowLabel : tr("Step {{step}}. {{instruction}}", { step: instructionIndex + 1, instruction: exerciseSteps[instructionIndex] });
    AccessibilityInfo.announceForAccessibility(message);
    // Announce state/step/phase changes, never animation frames or tenths of a second.
  }, [sessionState, announcedPhase, instructionIndex, showExerciseInfo, isBreathingExercise, language]);

  const rawPhaseTime = sessionState === 'countdown' ? '' : formatPhaseRemaining(frame.remainingSeconds, frame.phaseDuration);
  const phaseTimeText = rawPhaseTime ? `${formatNumber(Number(rawPhaseTime.slice(0, -1)), { minimumFractionDigits: rawPhaseTime.includes('.') ? 1 : 0 })}s` : '';

  useEffect(() => {
    const loadVisualization = async () => {
      const [mode, presetOverride] = await Promise.all([
        loadBreathingVisualizationMode(),
        loadBreathingCurvePresetOverride(),
      ]);
      setBreathingVisualizationMode(mode);
      setCurvePresetOverride(presetOverride);
    };
    loadVisualization();
  }, []);

  const handlePresetOverrideChange = async (preset: BreathingCurvePresetOverride) => {
    setCurvePresetOverride(preset);
    if (preset === 'relax') {
      hapticBreathingPhase();
    } else if (preset === 'energy') {
      hapticMedium();
    } else {
      hapticSelection();
    }
    await saveBreathingCurvePresetOverride(preset);
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const syncPreferences = async () => {
        const [mode, presetOverride] = await Promise.all([
          loadBreathingVisualizationMode(),
          loadBreathingCurvePresetOverride(),
        ]);
        if (!isActive) return;
        setBreathingVisualizationMode(mode);
        setCurvePresetOverride(presetOverride);
      };
      syncPreferences();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Screen edges={['top']} disableGradient>
      <View style={styles.container}>
        {!onboardingChecked ? null : showOnboarding ? (
          <View style={styles.onboardingContainer}>
            <View style={styles.onboardingHeader}>
              <TouchableOpacity accessibilityRole="button" onPress={handleSkipOnboarding} style={styles.panelCloseButton}>
                <Text style={styles.skipText}>{tr("Skip")}</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.onboardingContent}
              contentContainerStyle={[
                styles.onboardingContentInner,
                { paddingBottom: onboardingContentPaddingBottom },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {safetyWarning ? <View style={styles.warningSection}>
                <Text style={styles.warningTitle}>{tr("Before you begin")}</Text>
                <Text style={styles.warningText}>{safetyWarning}</Text>
              </View> : null}
              {!activeOnboardingPage ? null : activeOnboardingPage.customContent ? (
                renderCustomContent()
              ) : (
                // Standard content pages
                <>
                  <Ionicons
                    name={activeOnboardingPage.icon as any}
                    size={80}
                    color={Colors.primary}
                    style={styles.onboardingIcon}
                  />
                  <Text style={styles.onboardingTitle}>
                    {activeOnboardingPage.title}
                  </Text>
                  <Text style={styles.onboardingSubtitle}>
                    {activeOnboardingPage.subtitle}
                  </Text>
                  <Text style={styles.onboardingDescription}>
                    {activeOnboardingPage.description}
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={styles.onboardingProgressContainer}>
              <View style={styles.onboardingProgressTrack}>
                <View
                  style={[
                    styles.onboardingProgressFill,
                    { width: `${((currentPage + 1) / onboardingPages.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.onboardingProgressText}>
                {currentPage + 1}/{onboardingPages.length}
              </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={[styles.onboardingFooter, { paddingBottom: onboardingFooterPaddingBottom }]}>
              <TouchableOpacity
                style={styles.nextButton}
                accessibilityRole="button"
                onPress={handleNextPage}
              >
                <LinearGradient
                  colors={['#2DD4BF', '#14B8A6'] as any}
                  style={styles.nextButtonGradient}
                >
                  <View style={styles.nextButtonContent}>
                    <Text style={styles.nextButtonText}>
                      {currentPage === onboardingPages.length - 1 ? tr("Get Started") : tr("Next")}
                    </Text>
                  </View>
                  <Ionicons
                    name={currentPage === onboardingPages.length - 1 ? 'checkmark' : 'arrow-forward'}
                    size={20}
                    color={Colors.background}
                    style={styles.nextButtonIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.mainContent}>
            <TutorialOverlay
              visible={showTutorial}
              exerciseName={exerciseName}
              exerciseCategory={exerciseCategory || 'default'}
              origin={exerciseInfo.origin}
              onClose={() => setShowTutorial(false)}
              onStart={() => {
                setShowTutorial(false);
                if (sessionState === 'stress_prompt') {
                  handleStartSession();
                }
              }}
            />

            <View style={styles.header}>
              <TouchableOpacity onPress={handleHeaderLeft} style={styles.headerIconButton} accessibilityRole="button" accessibilityLabel={sessionState === 'stress_prompt' && preSessionStep > 1 ? tr("Previous preparation step") : tr("End practice and close")}>
                <Ionicons
                  name={sessionState === 'stress_prompt' && preSessionStep > 1 ? 'chevron-back' : 'close'}
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle} numberOfLines={2}>
                  {headerTitle}
                </Text>
                <View style={styles.headerMetaRow}>
                  <Text style={styles.headerSubtitle} numberOfLines={2}>
                    {headerSubtitle}
                  </Text>
                </View>
              </View>
              <View style={styles.headerIconSpacer} />
            </View>

            <View
              style={[
                styles.content,
                sessionState === 'stress_prompt' && styles.contentPreSession,
                { paddingBottom: bottomBarHeight },
              ]}
            >
              {sessionState === 'stress_prompt' ? (
                <View style={styles.setupFullContainer}>
                  {preSessionStep === 1 ? (
                    <View style={styles.preSessionStepContainer}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.preSessionInfoContent}
                      >
                        {safetyWarning ? <View style={styles.warningSection}>
                          <Text style={styles.warningTitle}>{tr("Before you begin")}</Text>
                          <Text style={styles.warningText}>{safetyWarning}</Text>
                        </View> : null}
                        {!isBreathingExercise && <Text style={styles.infoHistory}>{tr("Manual practice: follow the steps at your own pace. No breathing rhythm or hold duration is imposed.")}</Text>}
                        <Text style={styles.infoHistory}>{exerciseInfo.history}</Text>

                    <Text style={styles.infoSectionTitle}>{tr("How to do it")}</Text>
                        {exerciseSteps.map((step: string, index: number) => (
                          <View key={index} style={styles.infoStepRow}>
                            <View style={styles.infoStepNumber}>
                              <Text style={styles.infoStepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.infoStepText}>{step}</Text>
                          </View>
                        ))}

                        {exerciseTips && exerciseTips.length > 0 && (
                          <>
                            <Text style={styles.infoSectionTitle}> {tr("Tips")}</Text>
                            {exerciseTips.map((tip: string, index: number) => (
                              <Text key={index} style={styles.infoTip}>
                                • {tip}
                              </Text>
                            ))}
                          </>
                        )}

                        <Text style={styles.infoSectionTitle}> {tr("Benefits")}</Text>
                        <View style={styles.infoBenefits}>
                          {exerciseInfo.benefits.map((benefit: string, idx: number) => (
                            <View key={idx} style={styles.infoBenefitBadge}>
                              <Text style={styles.infoBenefitText}>{benefit}</Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>

                      <View style={styles.preSessionSpacer} />
                    </View>
                  ) : preSessionStep === 2 ? (
                    <ScrollView style={styles.preSessionStepContainer} contentContainerStyle={styles.preSessionInfoContent}>
                      <StressRating value={preStressLevel} onChange={handleStressLevelChange} />
                      <Text style={styles.stressHint}>{tr("This helps personalize your session")}</Text>
                    </ScrollView>
                  ) : (
                    <View style={styles.preSessionStepContainer}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.preSessionAudioContent}
                      >
                        <View style={styles.audioSelectorContainer}>
                          <AudioSelector
                            selectedAudioId={selectedAudioId}
                            onSelect={setSelectedAudioId}
                            recommendedId={audioRecommendation?.primary}
                            showPreviewButton
                          />
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <ScrollView style={styles.activeScroll} contentContainerStyle={styles.activeContent}>
                  {sessionState === 'countdown' || sessionState === 'countdown_paused' ? (
                    <View style={styles.phaseGuidanceContainer}>
                      <Text style={styles.countdownLabel} accessibilityLiveRegion="polite">
                        {sessionState === 'countdown_paused' ? tr("Countdown paused") : tr("Get ready")}
                      </Text>
                      <Text style={styles.countdownValue}>{countdownValue}</Text>
                      {sessionState === 'countdown_paused' && <Text style={styles.phaseCoachLine}>{tr("Resume when you are ready.")}</Text>}
                    </View>
                  ) : (
                    <>
                      <View style={styles.phaseGuidanceContainer}>
                        <Text style={styles.phaseLabel}>
                          {sessionState === 'paused' ? tr("Paused") : isBreathingExercise ? nowLabel : tr("At your own pace")}
                        </Text>
                        {isBreathingExercise ? (
                          <>
                            <Text style={styles.phaseTime}>{phaseTimeText}</Text>
                            <Text style={styles.phaseCoachLine}>
                              {sessionState === 'paused' ? tr("Your place is saved. Resume when you are ready.") : nowCoachLine}
                            </Text>
                            <Text style={styles.nextPhaseLabel}>
                              {sessionState === 'paused' ? tr("Resume: {{phase}}", { phase: nowLabel }) : tr("Next: {{phase}}", { phase: nextLabel })}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.guidanceCaption}>{tr("Manual steps · {{step}} of {{total}}", { step: instructionIndex + 1, total: exerciseSteps.length })}</Text>
                            <Text style={styles.manualInstruction}>{exerciseSteps[instructionIndex]}</Text>
                            <Text style={styles.phaseCoachLine}>
                              {sessionState === 'paused' ? tr("Resume before continuing.") : tr("Advance each step when ready. The timer measures your practice; it does not time these instructions.")}
                            </Text>
                            <View style={styles.stepControls}>
                              <TouchableOpacity style={styles.stepButton} disabled={!isPlaying || instructionIndex === 0}
                                accessibilityRole="button" accessibilityState={{ disabled: !isPlaying || instructionIndex === 0 }}
                                onPress={() => setInstructionIndex((index) => Math.max(0, index - 1))}>
                                <Text style={styles.stepButtonText}>{tr("Previous step")}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.stepButton} disabled={!isPlaying}
                                accessibilityRole="button" accessibilityState={{ disabled: !isPlaying }}
                                onPress={() => setInstructionIndex((index) => index + 1 < exerciseSteps.length ? index + 1 : 0)}>
                                <Text style={styles.stepButtonText}>{instructionIndex + 1 < exerciseSteps.length ? tr("Next step") : tr("Back to first step")}</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                      {isBreathingExercise && !reduceMotion && (
                        breathingVisualizationMode === 'graph' ? (
                          <BreathingGraph width={CIRCLE_SIZE} height={GRAPH_HEIGHT}
                            segments={cycleSegments} cycleTotalSeconds={cycleTotalSeconds}
                            cycleProgress={cycleProgress} activePhaseColor={phaseColor}
                            strokeColor={Colors.textMuted} curvePreset={resolvedCurvePreset} />
                        ) : (
                          <View style={[styles.circleWrapper, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]} accessible={false} importantForAccessibility="no-hide-descendants">
                            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.phaseRingSvg}>
                              {(() => {
                                let angle = 0;
                                const radius = CIRCLE_SIZE / 2 - 8;
                                return cycleSegments.map((segment, index) => {
                                  const start = angle;
                                  angle += segment.duration / cycleTotalSeconds * 360;
                                  const color = getPhaseColor(segment.phase, phasePalette);
                                  return (
                                    <React.Fragment key={`${segment.phase}-${index}`}>
                                      <Path d={describeArcPath(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, radius, start, angle)} stroke={color} strokeWidth={4} opacity={0.35} fill="none" />
                                      {index === activeSegmentIndex && smoothPhaseProgress > 0 && (
                                        <Path d={describeArcPath(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, radius, start, start + (angle - start) * smoothPhaseProgress)} stroke={color} strokeWidth={6} fill="none" />
                                      )}
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </Svg>
                            <View style={[styles.breathingCircle, { width: CIRCLE_SIZE * 0.76, height: CIRCLE_SIZE * 0.76, borderRadius: CIRCLE_SIZE / 2, transform: [{ scale: frame.circleScale }] }]}>
                              <View style={{ width: '65%', height: '65%', borderRadius: CIRCLE_SIZE / 2, backgroundColor: phaseColor, opacity: 0.18 }} />
                            </View>
                          </View>
                        )
                      )}
                    </>
                  )}
                  <View style={styles.progressContainerInline}>
                    <View style={styles.progressBar} accessible={false}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <View style={styles.timeLabels}>
                      <Text style={styles.timeLabel}>{tr("Elapsed")} {' '}{formatTime(elapsedTime)}</Text>
                      <Text style={styles.timeLabel}>{tr("Remaining")} {' '}{formatTime(sessionDuration - elapsedTime)}</Text>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>

            {showVolumeControl && sessionState !== 'stress_prompt' && (
              <View style={[styles.volumePanel, { bottom: bottomBarHeight + Spacing.md }]}>
                <View style={styles.volumeHeader}>
                  <Text style={styles.volumePanelTitle}>{tr("Volume")}</Text>
                  <TouchableOpacity onPress={() => setShowVolumeControl(false)} style={styles.panelCloseButton} accessibilityRole="button" accessibilityLabel={tr("Close volume controls")}>
                    <Ionicons name="close" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.volumeButtons}>
                  {volumeLevels.map((level) => (
                    <TouchableOpacity
                      key={level}
                      accessibilityRole="radio" accessibilityLabel={tr("Volume {{value}} percent", { value: Math.round(level * 100) })} accessibilityState={{ checked: audioVolume === level }}
                      style={[styles.volumeButton, audioVolume === level && styles.volumeButtonActive]}
                      onPress={() => handleVolumeChange(level)}
                    >
                      <Ionicons
                        name={level === 0 ? 'volume-mute' : level < 0.5 ? 'volume-low' : 'volume-high'}
                        size={20}
                        color={audioVolume === level ? Colors.background : Colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.volumeButtonText,
                          audioVolume === level && styles.volumeButtonTextActive,
                        ]}
                      >
                        {Math.round(level * 100)}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {presetInfo && <Text style={styles.volumePresetName}>{tr("Playing:")} {' '}{tr(presetInfo.name)}</Text>}
              </View>
            )}

            <View onLayout={(event) => setMeasuredBottomBarHeight(event.nativeEvent.layout.height)} style={[styles.bottomControls, { paddingBottom: bottomBarPaddingBottom }]}>
              {sessionState === 'stress_prompt' ? (
                <TouchableOpacity
                  style={styles.primaryCta}
                  disabled={isStartingSession} accessibilityRole="button" accessibilityState={{ disabled: isStartingSession }}
                  onPress={() => {
                    if (preSessionStep === 2 && !isStressRating(preStressLevel)) {
                      Alert.alert(tr("Choose your stress level"), tr("Select one option to continue."));
                      return;
                    }
                    if (preSessionStep < 3) {
                      setPreSessionStep((prev) => (prev + 1) as 1 | 2 | 3);
                      return;
                    }
                    handleStartSession();
                  }}
                >
                  {/* @ts-ignore - LinearGradient type issue with React 19 */}
                  <LinearGradient colors={['#2DD4BF', '#14B8A6'] as any} style={styles.primaryCtaGradient}>
                    <Ionicons
                      name={preSessionStep < 3 ? 'chevron-forward' : 'play'}
                      size={20}
                      color={Colors.background}
                    />
                    <Text style={styles.primaryCtaText}>{preSessionStep < 3 ? tr("Next") : tr("Start")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    accessibilityRole="button" accessibilityLabel={tr("Audio volume")} accessibilityState={{ expanded: showVolumeControl }}
                    style={[styles.controlButton, showVolumeControl && styles.controlButtonActive]}
                    onPress={() => setShowVolumeControl(!showVolumeControl)}
                  >
                    <Ionicons
                      name={audioVolume === 0 ? 'volume-mute-outline' : 'volume-high-outline'}
                      size={22}
                      color={showVolumeControl ? Colors.primary : Colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} accessibilityRole="button"
                    accessibilityLabel={isPlaying || sessionState === 'countdown' ? tr("Pause practice") : tr("Resume practice")}>
                    <Ionicons name={isPlaying || sessionState === 'countdown' ? 'pause' : 'play'} size={24} color={Colors.background} />
                    <Text style={styles.playButtonLabel}>{isPlaying || sessionState === 'countdown' ? tr("Pause") : tr("Resume")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    ref={infoButtonRef}
                    accessibilityRole="button" accessibilityLabel={tr("Instructions and practice options")} accessibilityState={{ expanded: showExerciseInfo }}
                    style={[styles.controlButton, showExerciseInfo && styles.controlButtonActive]}
                    onPress={openExerciseInfo}
                  >
                    <Ionicons name="information-circle-outline" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>


                </View>
              )}
            </View>

            {showExerciseInfo && (
              <Modal transparent animationType="fade" visible onRequestClose={closeExerciseInfo} onDismiss={focusInfoButton}
                onShow={() => { const node = findNodeHandle(infoHeadingRef.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); }}>
              <View style={styles.infoModalOverlay} accessibilityViewIsModal>
                <View style={styles.infoModalContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.infoModalHeader}>
                      <Text ref={infoHeadingRef} accessible accessibilityRole="header" style={styles.infoModalTitle}>{exerciseName}</Text>
                      <View style={styles.infoOriginBadge}>
                        <OriginIcon origin={exerciseInfo.originKey} size={18} />
                        <Text style={styles.originLabel}>{exerciseInfo.origin}</Text>
                      </View>
                    </View>
                    {safetyWarning ? <View style={styles.warningSection}>
                          <Text style={styles.warningTitle}>{tr("Before you begin")}</Text>
                          <Text style={styles.warningText}>{safetyWarning}</Text>
                        </View> : null}
                        {!isBreathingExercise && <Text style={styles.infoHistory}>{tr("Manual practice: follow the steps at your own pace. No breathing rhythm or hold duration is imposed.")}</Text>}
                        <Text style={styles.infoHistory}>{exerciseInfo.history}</Text>
                    <Text style={styles.infoHistory}>{tr("Practice is paused while these instructions are open. Close this panel, then choose Resume.")}</Text>
                    {isBreathingExercise && <View style={styles.visualOptions}>
                      <Text style={styles.infoSectionTitle}>{tr("Visual guide")}</Text>
                      <Text style={styles.infoHistory}>{tr("Appearance only. These options do not change the breathing protocol.")}</Text>
                      <TouchableOpacity style={styles.stepButton} onPress={toggleVisualizationMode} accessibilityRole="button" accessibilityLabel={breathingVisualizationMode === 'circle' ? tr("Switch to graph view") : tr("Switch to circle view")}>
                        <Text style={styles.stepButtonText}>{tr("View:")} {' '}{breathingVisualizationMode === 'circle' ? tr("Circle") : tr("Graph")}</Text>
                      </TouchableOpacity>
                      {(['default', 'relax', 'energy'] as const).map((preset) => (
                        <TouchableOpacity key={preset} style={styles.stepButton} onPress={() => handlePresetOverrideChange(preset)} accessibilityRole="radio" accessibilityState={{ checked: resolvedCurvePreset === preset }}>
                          <Text style={styles.stepButtonText}>{tr("Curve:")} {' '}{preset === 'default' ? tr("Linear") : preset === 'relax' ? tr("Smooth") : tr("Quick rise")}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>}
                    <Text style={styles.infoSectionTitle}>{tr("How to do it")}</Text>
                    {exerciseSteps.map((step: string, index: number) => (
                      <View key={index} style={styles.infoStepRow}>
                        <View style={styles.infoStepNumber}>
                          <Text style={styles.infoStepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.infoStepText}>{step}</Text>
                      </View>
                    ))}
                    {exerciseTips && exerciseTips.length > 0 && (
                      <>
                        <Text style={styles.infoSectionTitle}> {tr("Tips")}</Text>
                        {exerciseTips.map((tip: string, index: number) => (
                          <Text key={index} style={styles.infoTip}>
                            • {tip}
                          </Text>
                        ))}
                      </>
                    )}
                    <Text style={styles.infoSectionTitle}> {tr("Benefits")}</Text>
                    <View style={styles.infoBenefits}>
                      {exerciseInfo.benefits.map((benefit: string, idx: number) => (
                        <View key={idx} style={styles.infoBenefitBadge}>
                          <Text style={styles.infoBenefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  <TouchableOpacity style={styles.infoModalClose} onPress={closeExerciseInfo} accessibilityRole="button" accessibilityLabel={tr("Close instructions")}>
                    <Text style={styles.infoModalCloseText}>{tr("Close instructions")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </Modal>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  activeScroll: { flex: 1, width: '100%' },
  activeContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md },
  manualInstruction: { color: Colors.textPrimary, fontSize: FontSize.lg, textAlign: 'center', marginVertical: Spacing.md },
  stepControls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  stepButton: { minHeight: 48, padding: Spacing.md, justifyContent: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundCard, marginBottom: Spacing.xs },
  stepButtonText: { color: Colors.primary, fontSize: FontSize.md },
  playButtonLabel: { color: Colors.background, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  panelCloseButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  warningSection: { gap: Spacing.sm, marginBottom: Spacing.lg },
  warningTitle: { color: Colors.warning, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  warningText: { color: Colors.textPrimary, fontSize: FontSize.md },
  visualOptions: { marginBottom: Spacing.lg },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 28, 27, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    maxWidth: '100%',
  },
  headerIconSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: BOTTOM_BAR_HEIGHT,
  },
  contentPreSession: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  progressContainerInline: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  phaseGuidanceContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  guidanceCaption: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  nextPhaseLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  phaseCoachLine: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeLabels: {
    flexWrap: 'wrap',
    gap: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  phaseLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  phaseTime: {
    color: Colors.primary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xl,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseRingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  breathingCircle: {
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Split screen styles
  mainContent: {
    flex: 1,
  },
  // Breathing preview
  patternIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  indicator: {
    alignItems: 'center',
  },
  indicatorLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  indicatorTime: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  // Steps section
  stepText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  // Tips section
  // Start button

  setupScroll: {
    width: '100%',
    marginTop: Spacing.md,
    maxHeight: 320,
    alignSelf: 'stretch',
  },
  tipsListScroll: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  tipsListContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  audioSelectorContainer: {
    marginTop: Spacing.md,
  },
  setupFullContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  preSessionStepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  preSessionInfoContent: {
    paddingBottom: Spacing.xxl,
  },
  preSessionAudioContent: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  preSessionSpacer: {
    flex: 1,
  },

  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    minHeight: BOTTOM_BAR_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  primaryCta: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  primaryCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    minHeight: 56,
  },
  primaryCtaText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Onboarding styles
  onboardingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  onboardingHeader: {
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },
  onboardingContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  onboardingContentInner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingIcon: {
    marginBottom: Spacing.xl,
  },
  onboardingTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: FontFamily.heading,
  },
  onboardingSubtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontFamily: FontFamily.semibold,
  },
  onboardingDescription: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 26, // Increased line height for better readability
    fontFamily: FontFamily.regular,
  },
  onboardingProgressContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  onboardingProgressTrack: {
    width: '70%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  onboardingProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  onboardingProgressText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: FontFamily.medium,
  },
  onboardingFooter: {
    paddingBottom: Spacing.lg,
  },
  nextButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    minHeight: 56, // Ensure consistent height
  },
  nextButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonIcon: {
    position: 'absolute',
    right: Spacing.xl,
  },
  nextButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
    fontFamily: FontFamily.bold,
    lineHeight: 20, // Consistent line height
  },
  // Custom content styles
  customContentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  customContentIcon: {
    marginBottom: Spacing.lg,
  },
  patternPreview: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  patternCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  patternInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
  },
  patternText: {
    position: 'absolute',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: FontFamily.bold,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  tipItemIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tipItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  sessionInfo: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  // Missing styles
  stressQuestion: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stressHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  volumePanel: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    gap: Spacing.xl,
    backgroundColor: Colors.background,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    minWidth: 96,
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Countdown styles
  countdownLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
  },
  countdownValue: {
    color: Colors.primary,
    fontSize: 80,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xl,
  },
  // Stress prompt styles
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  volumePanelTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  volumeButtons: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  volumeButton: {
    flexGrow: 1,
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
  },
  volumeButtonActive: {
    backgroundColor: Colors.primary,
  },
  volumeButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  volumeButtonTextActive: {
    color: Colors.background,
  },
  volumePresetName: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  controlButtonActive: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
  },
  // Info modal styles
  infoModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  infoModalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  infoModalClose: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  infoModalCloseText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  infoModalHeader: {
    gap: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoModalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  infoOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  infoHistory: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  infoSectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoStepNumberText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  infoStepText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  infoTip: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  infoBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  infoBenefitBadge: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  infoBenefitText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  // Recommendation card styles
  // Exercise info header styles
  originDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  originBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  originLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  durationBadgeMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
