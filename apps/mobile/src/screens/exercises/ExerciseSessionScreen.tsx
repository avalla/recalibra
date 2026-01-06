import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable,
  Animated, 
  ScrollView,
  Dimensions,
  Alert,
  AppState
 } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useSessions, useAudio, getAudioRecommendation, useHaptics, useSubscription } from '../../hooks';
import type { AudioPresetKey, ExerciseCategory } from '../../hooks';
import type { RootStackParamList } from '../../types';
import { Screen } from '../../components';
import { TutorialOverlay } from '../../components/TutorialOverlay';
import { OriginIcon } from '../../components/OriginIcon';
import { getExerciseBackground } from '../../constants/backgrounds';
import { AUDIO_OPTIONS, type AudioOption, AudioSelector } from '../../components/AudioSelector';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const BOTTOM_BAR_HEIGHT = 76;

// Default fallback values when database data is not available
const DEFAULT_EXERCISE_INFO = {
  origin: 'Universal',
  history: 'A time-tested breathing technique for wellness.',
  benefits: ['Reduces stress', 'Improves focus', 'Enhances wellbeing'],
};

// Extended phases for special patterns
type BreathingPhase = 'inhale' | 'inhale2' | 'hold' | 'exhale' | 'rest' | 'retention';

interface BreathingPattern {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  special?: string;
  cycles?: number;
  rapid_cycles?: number;
  retention_seconds?: number;
}

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

type CycleSegment = {
  phase: BreathingPhase;
  duration: number;
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

function buildCycleSegments(pattern: BreathingPattern): CycleSegment[] {
  if (pattern.special === 'double_inhale') {
    const segments: CycleSegment[] = [
      { phase: 'inhale', duration: 2 },
      { phase: 'inhale2', duration: 1 },
      { phase: 'exhale', duration: 8 },
    ];
    if (pattern.rest > 0) segments.push({ phase: 'rest', duration: pattern.rest });
    return segments;
  }

  if (pattern.special === 'wim_hof') {
    const segments: CycleSegment[] = [
      { phase: 'inhale', duration: pattern.inhale },
      { phase: 'exhale', duration: pattern.exhale },
    ];
    const retention = pattern.retention_seconds || 60;
    if (retention > 0) segments.push({ phase: 'retention', duration: retention });
    return segments;
  }

  const segments: CycleSegment[] = [{ phase: 'inhale', duration: pattern.inhale }];
  if (pattern.hold > 0) segments.push({ phase: 'hold', duration: pattern.hold });
  segments.push({ phase: 'exhale', duration: pattern.exhale });
  if (pattern.rest > 0) segments.push({ phase: 'rest', duration: pattern.rest });
  return segments;
}

function getPhaseTypePalette(): PhasePalette {
  return {
    inhale: Colors.primary,
    hold: Colors.warning,
    exhale: Colors.success,
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
  const navigation = useNavigation<any>();
  const route = useRoute<SessionRouteProps>();
  const insets = useSafeAreaInsets();
  const { canAccessAudio } = useSubscription();
  
  const {
    exerciseId,
    exerciseName,
    durationMinutes,
    audioPreset,
    exerciseCategory,
    breathingPattern: routePattern,
    origin: dbOrigin,
    history: dbHistory,
    benefits: dbBenefits,
    tips: dbTips,
    instructions: dbInstructions,
  } = route.params;
  const { startSession, updateSessionStatus } = useSessions();
  const {
    breathingPhase: hapticBreathingPhase,
    success: hapticSuccess,
    selection: hapticSelection,
  } = useHaptics();

  // Use pattern from database or fallback to default
  const pattern: BreathingPattern = routePattern || DEFAULT_PATTERN;

  // Use data from database, fallback to defaults
  const exerciseInfo = {
    origin: dbOrigin || DEFAULT_EXERCISE_INFO.origin,
    originKey: dbOrigin?.toLowerCase() || 'universal',
    history: dbHistory || DEFAULT_EXERCISE_INFO.history,
    benefits: dbBenefits || DEFAULT_EXERCISE_INFO.benefits,
  };

  // Default steps and tips if not in database
  const defaultSteps = ['Follow the circle animation on screen', 'Inhale when the circle expands', 'Exhale when the circle contracts', 'Hold when indicated'];
  const defaultTips = ['Find a quiet, comfortable place', 'Practice regularly for best results', 'Stop if you feel dizzy'];

  const exerciseSteps =
    dbInstructions?.map((i: { instruction: string }) => i.instruction) || defaultSteps;
  const exerciseTips = dbTips || defaultTips;

  // Audio selection state - user can override the default from exercise
  const [selectedAudioId, setSelectedAudioId] = useState<AudioPresetKey>(() => {
    if (!audioPreset) return 'silence';
    const isValidPreset = AUDIO_OPTIONS.some((option: AudioOption) => option.id === audioPreset);
    if (!isValidPreset) return 'silence';
    if (!canAccessAudio(audioPreset)) return 'silence';
    return audioPreset as AudioPresetKey;
  });
  const [audioRecommendation, setAudioRecommendation] = useState<{
    primary: AudioPresetKey;
    reason: string;
  } | null>(null);

  // Audio hook - use the user-selected audio
  const audioPresetKey = selectedAudioId;
  console.log('[ExerciseSession] Selected audio:', selectedAudioId, '-> key:', audioPresetKey);

  const [audioVolume, setAudioVolume] = useState(0.7);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);

  // Onboarding state
  const [currentPage, setCurrentPage] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const onboardingPages = useMemo(() => {
    const pages: Array<Record<string, any>> = [
      {
        title: 'Welcome to ' + exerciseName,
        subtitle: 'Let\'s prepare your mind and body for this breathing exercise',
        description:
          'This practice will help you reduce stress and find inner calm through controlled breathing techniques.',
        icon: 'leaf-outline',
      },
      {
        title: 'Benefits',
        subtitle: 'What you\'ll experience',
        description: exerciseInfo.benefits
          .map((benefit: string, index: number) => `${index + 1}. ${benefit}`)
          .join('\n'),
        icon: 'heart-outline',
      },
      {
        title: 'Getting Ready',
        subtitle: 'Find a comfortable position',
        description:
          '• Sit comfortably with your back straight\n• Close your eyes or soften your gaze\n• Place your hands on your lap\n• Take a few deep breaths to settle in',
        icon: 'checkmark-circle-outline',
      },
      {
        title: 'Breathing Pattern',
        subtitle: 'Your rhythm for this session',
        customContent: 'breathingPattern',
        icon: 'time-outline',
      },
      {
        title: exerciseInfo.origin,
        subtitle: 'A short story behind this practice',
        customContent: 'originStory',
        icon: 'compass-outline',
      },
    ];

    exerciseSteps.forEach((step: string, index: number) => {
      pages.push({
        title: `Step ${index + 1}`,
        subtitle: 'Follow along',
        customContent: 'singleStep',
        payload: { text: step },
        icon: 'list-outline',
      });
    });

    if (exerciseTips.length > 0) {
      pages.push({
        title: 'Tips',
        subtitle: 'Small details that help',
        customContent: 'tipsList',
        icon: 'bulb-outline',
      });
    }

    return pages;
  }, [exerciseName, exerciseInfo.benefits, exerciseInfo.history, exerciseInfo.origin, exerciseSteps, exerciseTips]);

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
                          scale: scaleAnim.interpolate({
                            inputRange: [0, 1, 2, 3],
                            outputRange: [1, 1.3, 1, 0.8],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Text style={styles.patternText}>{pattern.inhale}-{pattern.hold}-{pattern.exhale}</Text>
              </View>
              <View style={styles.patternIndicators}>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>Inhale</Text>
                  <Text style={styles.indicatorTime}>{pattern.inhale}s</Text>
                </View>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>Hold</Text>
                  <Text style={styles.indicatorTime}>{pattern.hold}s</Text>
                </View>
                <View style={styles.indicator}>
                  <Text style={styles.indicatorLabel}>Exhale</Text>
                  <Text style={styles.indicatorTime}>{pattern.exhale}s</Text>
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
                  <Text style={styles.durationLabel}>{durationMinutes} min</Text>
                </View>
              </View>
            </View>

            {/* Stress Level Selector */}
            <Text style={styles.stressQuestion}>How are you feeling now?</Text>
            <View style={styles.stressList}>
              {[
                { level: 1, emoji: '😌', label: 'Calm', description: 'Relaxed and grounded' },
                { level: 5, emoji: '😐', label: 'Okay', description: 'Neutral / manageable' },
                { level: 9, emoji: '😰', label: 'Stressed', description: 'Tense or overwhelmed' },
              ].map((item) => {
                const isSelected = preStressLevel === item.level;
                return (
                  <Pressable
                    key={item.level}
                    style={({ pressed }) => [
                      styles.stressRow,
                      isSelected && styles.stressRowActive,
                      pressed && styles.stressRowPressed,
                      pressed && isSelected && styles.stressRowPressedActive,
                    ]}
                    android_ripple={{ color: 'rgba(102, 126, 234, 0.18)' }}
                    onPressIn={() => {
                      hapticSelection();
                    }}
                    onPress={() => handleStressLevelChange(item.level)}
                    hitSlop={12}
                  >
                    <View style={[styles.stressEmojiWrap, isSelected && styles.stressEmojiWrapActive]}>
                      <Text style={styles.stressEmoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.stressTextCol}>
                      <Text style={[styles.stressRowTitle, isSelected && styles.stressRowTitleActive]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.stressRowSubtitle, isSelected && styles.stressRowSubtitleActive]}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={[styles.stressRadioOuter, isSelected && styles.stressRadioOuterActive]}>
                      {isSelected && <View style={styles.stressRadioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.stressHint}>This helps personalize your session</Text>

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

  const { play: playAudio, stop: stopAudio, pause: pauseAudio, setVolume, isPlaying: isAudioPlaying, presetInfo } = useAudio({
    preset: audioPresetKey,
    volume: audioVolume,
    loop: true
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preStressLevel, setPreStressLevel] = useState(5);
  const [preSessionStep, setPreSessionStep] = useState<1 | 2 | 3>(1);
  const [sessionState, setSessionState] = useState<'stress_prompt' | 'countdown' | 'playing' | 'paused'>('stress_prompt');
  const [showTutorial, setShowTutorial] = useState(false);

  // Get background info for this exercise
  const exerciseBackground = getExerciseBackground(exerciseCategory || 'default');

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

  // Check if onboarding should be shown for this exercise
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingSeen = await AsyncStorage.getItem(`onboarding_${exerciseId}`);
      if (onboardingSeen) {
        setShowOnboarding(false);
      }
    };
    checkOnboardingStatus();
  }, [exerciseId]);

  // Update audio recommendation when stress level changes
  const handleStressLevelChange = (level: number) => {
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
      const recommendation = getAudioRecommendation(exerciseCategory as ExerciseCategory, preStressLevel);
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
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [phaseTime, setPhaseTime] = useState(pattern.inhale);
  const [elapsedTime, setElapsedTime] = useState(0);
  const sessionDuration = durationMinutes * 60;

  const [smoothPhaseProgress, setSmoothPhaseProgress] = useState(0);

  const phaseFadeAnim = useRef(new Animated.Value(1)).current;
  const prevPhaseColorRef = useRef<string>(Colors.primary);
  const currentPhaseColorRef = useRef<string>(Colors.primary);

  const sessionStartedAtMsRef = useRef<number | null>(null);
  const pausedAtMsRef = useRef<number | null>(null);
  const pausedTotalMsRef = useRef<number>(0);
  const isAutoPausingRef = useRef(false);

  const isPlaying = sessionState === 'playing';

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const phaseTextOpacityAnim = useRef(new Animated.Value(1)).current;

  const phaseStartedAtMsRef = useRef<number | null>(null);
  const phasePausedAtMsRef = useRef<number | null>(null);
  const phasePausedTotalMsRef = useRef<number>(0);

  // Get label for current phase (with special pattern support)
  const getPhaseLabel = (phase: BreathingPhase): string => {
    // Special labels based on pattern type
    if (pattern.special === 'humming' && phase === 'exhale') {
      return 'Hum ';
    }
    if (pattern.special === 'roar' && phase === 'exhale') {
      return 'Roar ';
    }
    if (pattern.special === 'ha_sound' && phase === 'exhale') {
      return 'HA! ';
    }

    switch (phase) {
      case 'inhale':
        return 'Inhale';
      case 'inhale2':
        return 'Inhale +'; // Second inhale for physiological sigh
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Exhale';
      case 'rest':
        return 'Rest';
      case 'retention':
        return 'Hold Empty'; // For Wim Hof retention
      default:
        return 'Breathe';
    }
  };

  const getPhaseCoachLine = (phase: BreathingPhase): string => {
    if (pattern.special === 'humming' && phase === 'exhale') {
      return 'Exhale with a gentle hum.';
    }
    if (pattern.special === 'roar' && phase === 'exhale') {
      return 'Exhale with a relaxed roar.';
    }
    if (pattern.special === 'ha_sound' && phase === 'exhale') {
      return 'Exhale and let out a soft “HA”.';
    }
    if (pattern.special === 'double_inhale') {
      if (phase === 'inhale') return 'Inhale gently through the nose.';
      if (phase === 'inhale2') return 'Top up with a quick sip of air.';
      if (phase === 'exhale') return 'Long, slow exhale.';
      if (phase === 'rest') return 'Pause and relax your shoulders.';
    }
    if (pattern.special === 'wim_hof') {
      if (phase === 'inhale') return 'Deep inhale into the belly and chest.';
      if (phase === 'exhale') return 'Let it go (no force).';
      if (phase === 'retention') return 'Hold after exhale. Stay relaxed.';
    }

    switch (phase) {
      case 'inhale':
        return 'Inhale slowly through the nose.';
      case 'inhale2':
        return 'A second, smaller inhale.';
      case 'hold':
        return 'Stay still. Soften your face.';
      case 'exhale':
        return 'Exhale gently and fully.';
      case 'rest':
        return 'Rest. Let the breath settle.';
      case 'retention':
        return 'Hold on empty. Stay calm.';
      default:
        return 'Follow the circle.';
    }
  };

  // Get next phase (with special pattern support)
  const getNextPhase = (phase: BreathingPhase): BreathingPhase => {
    // Double inhale pattern (Physiological Sigh)
    if (pattern.special === 'double_inhale') {
      switch (phase) {
        case 'inhale':
          return 'inhale2'; // Go to second inhale
        case 'inhale2':
          return 'exhale';
        case 'exhale':
          return pattern.rest > 0 ? 'rest' : 'inhale';
        case 'rest':
          return 'inhale';
        default:
          return 'inhale';
      }
    }

    // Wim Hof pattern (rapid cycles + retention)
    if (pattern.special === 'wim_hof') {
      switch (phase) {
        case 'inhale':
          return 'exhale';
        case 'exhale':
          return 'inhale'; // Continue rapid cycles (handled by cycle counter)
        case 'retention':
          return 'inhale'; // After retention, start new round
        default:
          return 'inhale';
      }
    }

    // Standard pattern
    switch (phase) {
      case 'inhale':
        return pattern.hold > 0 ? 'hold' : 'exhale';
      case 'hold':
        return 'exhale';
      case 'exhale':
        return pattern.rest > 0 ? 'rest' : 'inhale';
      case 'rest':
        return 'inhale';
      default:
        return 'inhale';
    }
  };

  // Get duration for phase (with special pattern support)
  const getPhaseDuration = (phase: BreathingPhase): number => {
    // Special durations
    if (pattern.special === 'double_inhale') {
      if (phase === 'inhale') return 2; // First short inhale
      if (phase === 'inhale2') return 1; // Second quick inhale
      if (phase === 'exhale') return 8; // Long exhale
      if (phase === 'rest') return pattern.rest;
    }

    if (pattern.special === 'wim_hof') {
      if (phase === 'retention') return pattern.retention_seconds || 60;
    }

    // Map phase to pattern property
    switch (phase) {
      case 'inhale':
      case 'inhale2':
        return pattern.inhale;
      case 'hold':
        return pattern.hold;
      case 'exhale':
        return pattern.exhale;
      case 'rest':
        return pattern.rest;
      case 'retention':
        return pattern.retention_seconds || 30;
      default:
        return pattern.inhale;
    }
  };

  // Animate the breathing circle
  useEffect(() => {
    if (!isPlaying) return;

    let targetScale = 0.6;
    switch (currentPhase) {
      case 'inhale':
        targetScale = 1;
        break;
      case 'inhale2':
        targetScale = 1.1; // Slightly larger for second inhale
        break;
      case 'hold':
        targetScale = 1;
        break;
      case 'exhale':
        targetScale = 0.6;
        break;
      case 'rest':
        targetScale = 0.6;
        break;
      case 'retention':
        targetScale = 0.4; // Smallest for empty hold
        break;
    }

    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: getPhaseDuration(currentPhase) * 1000,
      useNativeDriver: true,
    }).start();
  }, [currentPhase, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    phaseTextOpacityAnim.setValue(0);
    Animated.timing(phaseTextOpacityAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [currentPhase, isPlaying, phaseTextOpacityAnim]);

  // Timer logic
  useEffect(() => {
    if (!isPlaying) return;

    const ensureSessionStart = () => {
      if (sessionStartedAtMsRef.current === null) {
        sessionStartedAtMsRef.current = Date.now();
        pausedTotalMsRef.current = 0;
        pausedAtMsRef.current = null;
      }
      if (pausedAtMsRef.current !== null) {
        pausedTotalMsRef.current += Date.now() - pausedAtMsRef.current;
        pausedAtMsRef.current = null;
      }
    };

    ensureSessionStart();

    const timer = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(currentPhase);
          setCurrentPhase(nextPhase);
          hapticBreathingPhase();
          return getPhaseDuration(nextPhase);
        }
        return prev - 1;
      });

      const startedAt = sessionStartedAtMsRef.current;
      if (startedAt === null) return;

      const elapsedSeconds = Math.floor(
        (Date.now() - startedAt - pausedTotalMsRef.current) / 1000
      );
      const clampedElapsed = Math.min(sessionDuration, Math.max(0, elapsedSeconds));
      setElapsedTime((prev) => (prev === clampedElapsed ? prev : clampedElapsed));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentPhase]);

  useEffect(() => {
    if (sessionState !== 'paused') return;
    if (pausedAtMsRef.current !== null) return;
    if (sessionStartedAtMsRef.current === null) return;
    pausedAtMsRef.current = Date.now();
  }, [sessionState]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        isAutoPausingRef.current = false;
        return;
      }
      if (sessionState !== 'playing') return;
      if (isAutoPausingRef.current) return;
      isAutoPausingRef.current = true;
      pauseAudio();
      setSessionState('paused');
    });

    return () => {
      sub.remove();
    };
  }, [pauseAudio, sessionState]);

  // Handle session completion
  useEffect(() => {
    if (elapsedTime >= sessionDuration && sessionId && sessionState === 'playing') {
      setSessionState('paused');
      stopAudio();
      // Haptic feedback for session completion
      hapticSuccess();
      navigation.replace('PostSession', {
        sessionId,
        exerciseName,
        durationSeconds: elapsedTime,
        preStressLevel,
      });
    }
  }, [elapsedTime, sessionDuration, sessionId, sessionState]);

  // Countdown timer
  useEffect(() => {
    if (sessionState !== 'countdown') return;

    if (countdownValue === 0) {
      setSessionState('playing');
      // Start audio
      if (audioPresetKey !== 'silence') {
        playAudio();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdownValue((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionState, countdownValue, audioPresetKey, playAudio]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [isStartingSession, setIsStartingSession] = useState(false);

  const handleStartSession = async () => {
    if (isStartingSession) return;
    if (!exerciseId) {
      Alert.alert('Error', 'Missing exercise id. Please go back and try again.');
      return;
    }

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
        Alert.alert('Error', error.message || 'Failed to start session. Please try again.');
        return;
      }

      if (!sessionData) {
        console.error('[ExerciseSessionScreen] Failed to start session: empty response');
        Alert.alert('Error', 'Failed to start session. Please try again.');
        return;
      }

      setSessionId(sessionData.id);
      // Start countdown
      setCountdownValue(3);
      setSessionState('countdown');
    } catch (error) {
      console.error('[ExerciseSessionScreen] Unexpected startSession error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start session. Please try again.'
      );
    } finally {
      setIsStartingSession(false);
    }
  };

  const handlePlayPause = async () => {
    if (sessionState === 'stress_prompt') {
      handleStartSession();
    } else if (sessionState === 'playing') {
      pauseAudio();
      setSessionState('paused');
    } else if (sessionState === 'paused') {
      playAudio();
      setSessionState('playing');
    }
  };

  const handleClose = async () => {
    // Stop audio before leaving
    await stopAudio();

    // Mark session as abandoned if it was started
    if (sessionId && sessionState !== 'stress_prompt') {
      await updateSessionStatus(sessionId, 'abandoned', elapsedTime);
    }

    navigation.goBack();
  };

  const handleHeaderLeft = async () => {
    if (sessionState === 'stress_prompt' && preSessionStep > 1) {
      setPreSessionStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
      return;
    }

    await handleClose();
  };

  const headerTitle = useMemo(() => {
    if (sessionState !== 'stress_prompt') return exerciseName;
    if (preSessionStep === 1) return exerciseName;
    if (preSessionStep === 2) return 'Before we start';
    return 'Audio';
  }, [exerciseName, preSessionStep, sessionState]);

  const headerSubtitle = useMemo(() => {
    if (sessionState !== 'stress_prompt') return `${exerciseInfo.origin} · ${durationMinutes} min`;
    if (preSessionStep === 1) return `${exerciseInfo.origin} - ${durationMinutes} min`;
    if (preSessionStep === 2) return 'How are you feeling right now?';
    return 'Choose a background sound';
  }, [durationMinutes, exerciseInfo.origin, preSessionStep, sessionState]);

  const progress = elapsedTime / sessionDuration;

  const handleVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
    setVolume(newVolume);
  };

  const volumeLevels = [0, 0.25, 0.5, 0.75, 1];

  const bottomBarPaddingBottom = Math.max(Math.min(insets.bottom, Spacing.md), Spacing.xs);
  const bottomBarHeight = BOTTOM_BAR_HEIGHT + bottomBarPaddingBottom;
  const onboardingContentPaddingBottom = 140 + insets.bottom;
  const onboardingFooterPaddingBottom = Spacing.lg + insets.bottom;

  const nextPhase = useMemo(() => getNextPhase(currentPhase), [currentPhase]);
  const nowLabel = useMemo(() => getPhaseLabel(currentPhase), [currentPhase]);
  const nextLabel = useMemo(() => getPhaseLabel(nextPhase), [nextPhase]);
  const nowCoachLine = useMemo(() => getPhaseCoachLine(currentPhase), [currentPhase]);
  const nextCoachLine = useMemo(() => getPhaseCoachLine(nextPhase), [nextPhase]);

  const phaseDuration = useMemo(() => getPhaseDuration(currentPhase), [currentPhase]);

  const phasePalette = useMemo(() => getPhaseTypePalette(), []);
  const activePhaseColor = useMemo(() => getPhaseColor(currentPhase, phasePalette), [currentPhase, phasePalette]);

  // Smooth phase progress (for ring + dot), based on real time rather than 1s ticks
  useEffect(() => {
    if (sessionState !== 'playing') {
      if (phaseStartedAtMsRef.current !== null && phasePausedAtMsRef.current === null) {
        phasePausedAtMsRef.current = Date.now();
      }
      return;
    }

    // entering/resuming playing
    if (phaseStartedAtMsRef.current === null) {
      phaseStartedAtMsRef.current = Date.now();
      phasePausedTotalMsRef.current = 0;
      phasePausedAtMsRef.current = null;
      setSmoothPhaseProgress(0);
      return;
    }

    if (phasePausedAtMsRef.current !== null) {
      phasePausedTotalMsRef.current += Date.now() - phasePausedAtMsRef.current;
      phasePausedAtMsRef.current = null;
    }
  }, [sessionState]);

  useEffect(() => {
    // Crossfade from the *previous* active color to the new one
    const previous = currentPhaseColorRef.current;
    prevPhaseColorRef.current = previous;
    currentPhaseColorRef.current = activePhaseColor;

    phaseFadeAnim.stopAnimation();
    phaseFadeAnim.setValue(0);
    Animated.timing(phaseFadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [activePhaseColor, phaseFadeAnim]);

  useEffect(() => {
    if (sessionState !== 'playing') return;
    phaseStartedAtMsRef.current = Date.now();
    phasePausedAtMsRef.current = null;
    phasePausedTotalMsRef.current = 0;
    setSmoothPhaseProgress(0);
  }, [currentPhase, sessionState]);

  useEffect(() => {
    if (sessionState !== 'playing') return;
    if (phaseDuration <= 0) return;

    let rafId = 0;

    const tick = () => {
      const startedAt = phaseStartedAtMsRef.current;
      if (startedAt === null) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const elapsedMs = Date.now() - startedAt - phasePausedTotalMsRef.current;
      const progress = clampNumber(elapsedMs / (phaseDuration * 1000), 0, 1);
      setSmoothPhaseProgress(progress);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phaseDuration, sessionState]);

  const cycleSegments = useMemo(() => buildCycleSegments(pattern), [pattern]);

  const cycleTotalSeconds = useMemo(() => {
    const total = cycleSegments.reduce((sum, s) => sum + s.duration, 0);
    return total > 0 ? total : 1;
  }, [cycleSegments]);

  const activeSegmentIndex = useMemo(() => {
    const idx = cycleSegments.findIndex((s) => s.phase === currentPhase);
    return idx >= 0 ? idx : 0;
  }, [currentPhase, cycleSegments]);

  const phaseColor = activePhaseColor;

  const phaseTimeText = useMemo(() => {
    if (sessionState === 'countdown') return '';
    return `${phaseTime}s`;
  }, [phaseTime, sessionState]);

  return (
    <Screen edges={['top']} disableGradient>
      <View style={styles.container}>
        {showOnboarding ? (
          <View style={styles.onboardingContainer}>
            <View style={styles.onboardingHeader}>
              <TouchableOpacity onPress={handleSkipOnboarding}>
                <Text style={styles.skipText}>Skip</Text>
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
                onPress={handleNextPage}
              >
                <LinearGradient
                  colors={['#667EEA', '#764BA2'] as any}
                  style={styles.nextButtonGradient}
                >
                  <View style={styles.nextButtonContent}>
                    <Text style={styles.nextButtonText}>
                      {currentPage === onboardingPages.length - 1 ? 'Get Started' : 'Next'}
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
              <TouchableOpacity onPress={handleHeaderLeft} style={styles.headerIconButton}>
                <Ionicons
                  name={sessionState === 'stress_prompt' && preSessionStep > 1 ? 'chevron-back' : 'close'}
                  size={22}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {headerTitle}
                </Text>
                <View style={styles.headerMetaRow}>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
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
                        <Text style={styles.infoHistory}>{exerciseInfo.history}</Text>

                        <Text style={styles.infoSectionTitle}>How to do it</Text>
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
                            <Text style={styles.infoSectionTitle}> Tips</Text>
                            {exerciseTips.map((tip: string, index: number) => (
                              <Text key={index} style={styles.infoTip}>
                                • {tip}
                              </Text>
                            ))}
                          </>
                        )}

                        <Text style={styles.infoSectionTitle}> Benefits</Text>
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
                    <View style={styles.preSessionStepContainer}>
                      <View style={styles.stressList}>
                        {[
                          { level: 1, emoji: '', label: 'Calm', description: 'Relaxed and grounded' },
                          { level: 5, emoji: '', label: 'Okay', description: 'Neutral / manageable' },
                          { level: 9, emoji: '', label: 'Stressed', description: 'Tense or overwhelmed' },
                        ].map((item) => {
                          const isSelected = preStressLevel === item.level;
                          return (
                            <Pressable
                              key={item.level}
                              style={({ pressed }) => [
                                styles.stressRow,
                                isSelected && styles.stressRowActive,
                                pressed && styles.stressRowPressed,
                                pressed && isSelected && styles.stressRowPressedActive,
                              ]}
                              android_ripple={{ color: 'rgba(102, 126, 234, 0.18)' }}
                              onPressIn={() => {
                                hapticSelection();
                              }}
                              onPress={() => handleStressLevelChange(item.level)}
                              hitSlop={12}
                            >
                              <View style={[styles.stressEmojiWrap, isSelected && styles.stressEmojiWrapActive]}>
                                <Text style={styles.stressEmoji}>{item.emoji}</Text>
                              </View>
                              <View style={styles.stressTextCol}>
                                <Text style={[styles.stressRowTitle, isSelected && styles.stressRowTitleActive]}>
                                  {item.label}
                                </Text>
                                <Text style={[styles.stressRowSubtitle, isSelected && styles.stressRowSubtitleActive]}>
                                  {item.description}
                                </Text>
                              </View>
                              <View style={[styles.stressRadioOuter, isSelected && styles.stressRadioOuterActive]}>
                                {isSelected && <View style={styles.stressRadioInner} />}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                      <Text style={styles.stressHint}>This helps personalize your session</Text>

                      <View style={styles.preSessionSpacer} />
                    </View>
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
                <View style={styles.circleContainer}>
                  {sessionState === 'countdown' ? (
                    <>
                      <Text style={styles.countdownLabel}>Get Ready</Text>
                      <Text style={styles.countdownValue}>{countdownValue}</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.phaseGuidanceContainer}>
                        <Text style={styles.guidanceCaption}>Now</Text>
                        <Animated.Text style={[styles.phaseLabel, { opacity: phaseTextOpacityAnim }]}>
                          {nowLabel}
                        </Animated.Text>
                        <Animated.Text style={[styles.phaseTime, { opacity: phaseTextOpacityAnim }]}>
                          {phaseTimeText}
                        </Animated.Text>
                        <Animated.Text style={[styles.phaseCoachLine, { opacity: phaseTextOpacityAnim }]}>
                          {nowCoachLine}
                        </Animated.Text>
                        <Text style={styles.guidanceCaption}>Next</Text>
                        <Text style={styles.nextPhaseLabel}>{nextLabel}</Text>
                        <Text style={styles.nextPhaseCoachLine}>{nextCoachLine}</Text>
                      </View>
                    </>
                  )}

                  <View style={styles.circleWrapper}>
                    <View style={styles.outerRing}>
                      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.phaseRingSvg}>
                        {(() => {
                          const cx = CIRCLE_SIZE / 2;
                          const cy = CIRCLE_SIZE / 2;
                          const r = CIRCLE_SIZE / 2 - 8;
                          const strokeWidth = 6;
                          let angleCursor = -90;

                          const AnimatedPath = Animated.createAnimatedComponent(Path);
                          const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

                          return cycleSegments.map((segment, index) => {
                            const sweep = (segment.duration / cycleTotalSeconds) * 360;
                            const startAngle = angleCursor;
                            const endAngle = angleCursor + sweep;
                            angleCursor += sweep;

                            const basePath = describeArcPath(cx, cy, r, startAngle, endAngle);
                            const isActive = index === activeSegmentIndex;
                            const activeEndAngle = startAngle + sweep * smoothPhaseProgress;
                            const activeSweep = activeEndAngle - startAngle;
                            const safeActiveEndAngle = activeSweep < 0.5 ? startAngle + 0.5 : activeEndAngle;
                            const activePath = describeArcPath(cx, cy, r, startAngle, safeActiveEndAngle);

                            const segmentColor = getPhaseColor(segment.phase, phasePalette);

                            return (
                              <React.Fragment key={`${segment.phase}-${index}`}>
                                <Path
                                  d={basePath}
                                  stroke={segmentColor}
                                  strokeWidth={strokeWidth}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  opacity={isActive ? 0.35 : 0.14}
                                />
                                {isActive && (
                                  <>
                                    <AnimatedPath
                                      d={activePath}
                                      stroke={prevPhaseColorRef.current}
                                      strokeWidth={strokeWidth}
                                      strokeLinecap="round"
                                      fill="transparent"
                                      opacity={phaseFadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 0],
                                      })}
                                    />
                                    <AnimatedPath
                                      d={activePath}
                                      stroke={segmentColor}
                                      strokeWidth={strokeWidth}
                                      strokeLinecap="round"
                                      fill="transparent"
                                      opacity={phaseFadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 0.95],
                                      })}
                                    />
                                    {(() => {
                                      const dotPos = polarToCartesian(cx, cy, r, safeActiveEndAngle);
                                      return (
                                        <>
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={10}
                                            fill={prevPhaseColorRef.current}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0.18, 0],
                                            })}
                                          />
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={7}
                                            fill={prevPhaseColorRef.current}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0.28, 0],
                                            })}
                                          />
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={4}
                                            fill={prevPhaseColorRef.current}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0.95, 0],
                                            })}
                                          />
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={10}
                                            fill={segmentColor}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0, 0.18],
                                            })}
                                          />
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={7}
                                            fill={segmentColor}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0, 0.28],
                                            })}
                                          />
                                          <AnimatedSvgCircle
                                            cx={dotPos.x}
                                            cy={dotPos.y}
                                            r={4}
                                            fill={segmentColor}
                                            opacity={phaseFadeAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [0, 0.95],
                                            })}
                                          />
                                        </>
                                      );
                                    })()}
                                  </>
                                )}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </Svg>
                    </View>
                    <Animated.View
                      style={[
                        styles.breathingCircle,
                        { backgroundColor: Colors.backgroundElevated },
                        { transform: [{ scale: scaleAnim }] },
                      ]}
                    >
                      <View style={[styles.innerCircle, { backgroundColor: phaseColor, opacity: 0.14 }]} />
                    </Animated.View>
                  </View>

                  <View style={styles.progressContainerInline}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <View style={styles.timeLabels}>
                      <Text style={styles.timeLabel}>{formatTime(elapsedTime)}</Text>
                      <Text style={styles.timeLabel}>{formatTime(sessionDuration)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {showVolumeControl && sessionState !== 'stress_prompt' && (
              <View style={[styles.volumePanel, { bottom: bottomBarHeight + Spacing.md }]}>
                <View style={styles.volumeHeader}>
                  <Text style={styles.volumePanelTitle}>Volume</Text>
                  <TouchableOpacity onPress={() => setShowVolumeControl(false)}>
                    <Ionicons name="close" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.volumeButtons}>
                  {volumeLevels.map((level) => (
                    <TouchableOpacity
                      key={level}
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
                {presetInfo && <Text style={styles.volumePresetName}>Playing: {presetInfo.name}</Text>}
              </View>
            )}

            <View style={[styles.bottomControls, { paddingBottom: bottomBarPaddingBottom }]}>
              {sessionState === 'stress_prompt' ? (
                <TouchableOpacity
                  style={styles.primaryCta}
                  onPress={() => {
                    if (preSessionStep < 3) {
                      setPreSessionStep((prev) => ((prev + 1) as 1 | 2 | 3));
                      return;
                    }
                    handleStartSession();
                  }}
                >
                  {/* @ts-ignore - LinearGradient type issue with React 19 */}
                  <LinearGradient colors={['#667EEA', '#764BA2'] as any} style={styles.primaryCtaGradient}>
                    <Ionicons
                      name={preSessionStep < 3 ? 'chevron-forward' : 'play'}
                      size={20}
                      color={Colors.background}
                    />
                    <Text style={styles.primaryCtaText}>{preSessionStep < 3 ? 'Next' : 'Start'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.controlButton, showVolumeControl && styles.controlButtonActive]}
                    onPress={() => setShowVolumeControl(!showVolumeControl)}
                  >
                    <Ionicons
                      name={audioVolume === 0 ? 'volume-mute-outline' : 'volume-high-outline'}
                      size={22}
                      color={showVolumeControl ? Colors.primary : Colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={Colors.background} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, showExerciseInfo && styles.controlButtonActive]}
                    onPress={() => setShowExerciseInfo(true)}
                  >
                    <Ionicons name="information-circle-outline" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {showExerciseInfo && (
              <View style={styles.infoModalOverlay}>
                <View style={styles.infoModalContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.infoModalHeader}>
                      <Text style={styles.infoModalTitle}>{exerciseName}</Text>
                      <View style={styles.infoOriginBadge}>
                        <OriginIcon origin={exerciseInfo.originKey} size={18} />
                        <Text style={styles.originLabel}>{exerciseInfo.origin}</Text>
                      </View>
                    </View>
                    <Text style={styles.infoHistory}>{exerciseInfo.history}</Text>
                    <Text style={styles.infoSectionTitle}>How to do it</Text>
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
                        <Text style={styles.infoSectionTitle}> Tips</Text>
                        {exerciseTips.map((tip: string, index: number) => (
                          <Text key={index} style={styles.infoTip}>
                            • {tip}
                          </Text>
                        ))}
                      </>
                    )}
                    <Text style={styles.infoSectionTitle}> Benefits</Text>
                    <View style={styles.infoBenefits}>
                      {exerciseInfo.benefits.map((benefit: string, idx: number) => (
                        <View key={idx} style={styles.infoBenefitBadge}>
                          <Text style={styles.infoBenefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  <TouchableOpacity style={styles.infoModalClose} onPress={() => setShowExerciseInfo(false)}>
                    <Text style={styles.infoModalCloseText}>Got it!</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIconButton: {
    width: 40,
    height: 40,
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
  originBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  originLabelCompact: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
  },
  durationBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  durationLabelCompact: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
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
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
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
  nextPhaseCoachLine: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  circleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainerPre: {
    justifyContent: 'flex-start',
    paddingTop: Spacing.xl,
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
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  phaseRingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  breathingCircle: {
    width: CIRCLE_SIZE * 0.8,
    height: CIRCLE_SIZE * 0.8,
    borderRadius: CIRCLE_SIZE * 0.4,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: CIRCLE_SIZE * 0.5,
    height: CIRCLE_SIZE * 0.5,
    borderRadius: CIRCLE_SIZE * 0.25,
    backgroundColor: Colors.backgroundCard,
  },
  // Split screen styles
  splitScreen: {
    flex: 1,
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bottomSection: {
    flex: 1.5,
    backgroundColor: Colors.background,
  },
  instructionsScroll: {
    flex: 1,
  },
  instructionsContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Breathing preview
  breathingPreview: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  previewInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
  },
  previewText: {
    position: 'absolute',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  patternIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  stepsSection: {
    marginBottom: Spacing.xl,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  // Tips section
  tipsSection: {
    marginBottom: Spacing.xl,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8DC',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFA50030',
  },
  tipIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  // Start button
  startButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },

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
  setupScrollContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  tipsListContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  setupCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setupTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.heading,
  },
  setupSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
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
  preSessionAudioIntro: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  preSessionSpacer: {
    flex: 1,
  },
  setupFullScroll: {
    flex: 1,
  },
  setupFullScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  setupSecondaryCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setupSecondaryTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  setupSecondaryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
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
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
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
  stepsScroll: {
    flex: 1,
    width: '100%',
    marginTop: Spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipsScroll: {
    flex: 1,
    width: '100%',
    marginTop: Spacing.lg,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
  stressValue: {
    color: Colors.primary,
    fontSize: 36,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  stressList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
    gap: Spacing.md,
  },
  stressRowPressed: {
    opacity: 0.9,
  },
  stressRowPressedActive: {
    opacity: 0.95,
  },
  stressRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
  },
  stressEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
  },
  stressEmojiWrapActive: {
    backgroundColor: Colors.primary,
  },
  stressEmoji: {
    fontSize: 22,
  },
  stressTextCol: {
    flex: 1,
  },
  stressRowTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  stressRowTitleActive: {
    color: Colors.textPrimary,
  },
  stressRowSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  stressRowSubtitleActive: {
    color: Colors.textSecondary,
  },
  stressRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressRadioOuterActive: {
    borderColor: Colors.primary,
  },
  stressRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  stressPromptContent: {
    alignItems: 'center',
    paddingBottom: 120,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  volumeButton: {
    flex: 1,
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
    flexDirection: 'row',
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
  infoOriginFlag: {
    fontSize: 16,
  },
  infoOriginText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
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
  recommendationCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  recommendationTitle: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  recommendationAudio: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  recommendationReason: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  recommendationCardActive: {
    borderLeftColor: Colors.success,
    backgroundColor: Colors.backgroundElevated,
  },
  recommendationTap: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  selectedBadgeText: {
    color: Colors.background,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  selectBadge: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  selectBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  // Exercise info header styles
  exerciseInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  durationText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  exerciseInfoSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
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
  originFlag: {
    fontSize: 18,
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
  exerciseHistory: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  benefitCheck: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  benefitLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  benefitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  benefitText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
