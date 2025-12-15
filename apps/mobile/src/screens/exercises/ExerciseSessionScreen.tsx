import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useSessions, useAudio, AUDIO_PRESETS, getAudioRecommendation, useHaptics } from '../../hooks';
import type { AudioPresetKey, ExerciseCategory } from '../../hooks';
import type { ExerciseStackParamList } from '../../types';
import { AudioSelector, ExerciseInstructions } from '../../components';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

// Helper to get flag emoji from origin
const getOriginFlag = (origin?: string): string => {
  const flags: Record<string, string> = {
    'usa': '🇺🇸',
    'india': '🇮🇳',
    'china': '🇨🇳',
    'japan': '🇯🇵',
    'tibet': '🏔️',
    'sufi': '☪️',
    'hawaii': '🌺',
    'universal': '🌍',
  };
  return flags[origin?.toLowerCase() || ''] || '🌍';
};

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

type SessionRouteProps = RouteProp<ExerciseStackParamList, 'ExerciseSession'>;

export const ExerciseSessionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<SessionRouteProps>();
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
  const { breathingPhase: hapticBreathingPhase, success: hapticSuccess } = useHaptics();
  
  // Use pattern from database or fallback to default
  const pattern: BreathingPattern = routePattern || DEFAULT_PATTERN;
  
  // Use data from database, fallback to defaults
  const exerciseInfo = {
    origin: dbOrigin || DEFAULT_EXERCISE_INFO.origin,
    flag: getOriginFlag(dbOrigin),
    history: dbHistory || DEFAULT_EXERCISE_INFO.history,
    benefits: dbBenefits || DEFAULT_EXERCISE_INFO.benefits,
  };
  
  // Default steps and tips if not in database
  const defaultSteps = ['Follow the circle animation on screen', 'Inhale when the circle expands', 'Exhale when the circle contracts', 'Hold when indicated'];
  const defaultTips = ['Find a quiet, comfortable place', 'Practice regularly for best results', 'Stop if you feel dizzy'];
  
  const exerciseSteps = dbInstructions?.map(i => i.instruction) || defaultSteps;
  const exerciseTips = dbTips || defaultTips;
  
  // Audio selection state - user can override the default from exercise
  const [selectedAudioId, setSelectedAudioId] = useState<string>(audioPreset || 'silence');
  const [audioRecommendation, setAudioRecommendation] = useState<{
    primary: AudioPresetKey;
    reason: string;
  } | null>(null);
  
  // Audio hook - use the user-selected audio
  const audioPresetKey = selectedAudioId as AudioPresetKey;
  console.log('[ExerciseSession] Selected audio:', selectedAudioId, '-> key:', audioPresetKey);
  
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  
  const { play: playAudio, stop: stopAudio, pause: pauseAudio, setVolume, isPlaying: isAudioPlaying, presetInfo } = useAudio({ 
    preset: audioPresetKey,
    volume: audioVolume,
    loop: true 
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [preStressLevel, setPreStressLevel] = useState(5);
  const [sessionState, setSessionState] = useState<'stress_prompt' | 'countdown' | 'playing' | 'paused'>('stress_prompt');

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
  
  const isPlaying = sessionState === 'playing';

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get label for current phase (with special pattern support)
  const getPhaseLabel = (phase: BreathingPhase): string => {
    // Special labels based on pattern type
    if (pattern.special === 'humming' && phase === 'exhale') {
      return 'Hum 🐝';
    }
    if (pattern.special === 'roar' && phase === 'exhale') {
      return 'Roar 🦁';
    }
    if (pattern.special === 'ha_sound' && phase === 'exhale') {
      return 'HA! 🌺';
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

  // Timer logic
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(currentPhase);
          setCurrentPhase(nextPhase);
          // Haptic feedback on phase change
          hapticBreathingPhase();
          return getPhaseDuration(nextPhase);
        }
        return prev - 1;
      });

      setElapsedTime((prev) => {
        if (prev >= sessionDuration - 1) {
          return sessionDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentPhase]);

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
        durationSeconds: sessionDuration,
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

  const handleStartSession = async () => {
    // Create session in database
    const { data, error } = await startSession(exerciseId, preStressLevel);
    if (error) {
      Alert.alert('Error', 'Failed to start session. Please try again.');
      return;
    }
    if (data) {
      setSessionId(data.id);
      // Start countdown
      setCountdownValue(3);
      setSessionState('countdown');
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

  const progress = elapsedTime / sessionDuration;

  const handleVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
    setVolume(newVolume);
  };

  const volumeLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exerciseName}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress Bar - only show during active session */}
      {sessionState !== 'stress_prompt' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.timeLabel}>{formatTime(sessionDuration)}</Text>
          </View>
        </View>
      )}

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        {sessionState === 'countdown' ? (
          <>
            <Text style={styles.countdownLabel}>Get Ready</Text>
            <Text style={styles.countdownValue}>{countdownValue}</Text>
          </>
        ) : sessionState === 'stress_prompt' ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stressPromptContent}
          >
            {/* Exercise Info */}
            <View style={styles.exerciseInfoSection}>
              {/* Origin & Duration Row */}
              <View style={styles.originDurationRow}>
                <View style={styles.originBadge}>
                  <Text style={styles.originFlag}>{exerciseInfo.flag}</Text>
                  <Text style={styles.originLabel}>{exerciseInfo.origin}</Text>
                </View>
                <View style={styles.dividerDot} />
                <View style={styles.durationBadgeMinimal}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.durationLabel}>{durationMinutes} min</Text>
                </View>
              </View>
              
              {/* History */}
              <Text style={styles.exerciseHistory}>{exerciseInfo.history}</Text>
              
              {/* Benefits */}
              <View style={styles.benefitsList}>
                {exerciseInfo.benefits.map((benefit: string, idx: number) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Text style={styles.benefitCheck}>✓</Text>
                    <Text style={styles.benefitLabel}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.phaseLabel}>How stressed are you?</Text>
            <View style={styles.stressSlider}>
              {[
                { level: 1, emoji: '😌' },
                { level: 3, emoji: '🙂' },
                { level: 5, emoji: '😐' },
                { level: 7, emoji: '😟' },
                { level: 9, emoji: '😰' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.level}
                  style={[
                    styles.stressButton,
                    preStressLevel === item.level && styles.stressButtonActive,
                  ]}
                  onPress={() => handleStressLevelChange(item.level)}
                >
                  <Text style={styles.stressEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.stressButtonText,
                    preStressLevel === item.level && styles.stressButtonTextActive,
                  ]}>{item.level}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.stressHint}>1 = Calm, 9 = Very stressed</Text>

            {/* Exercise Instructions */}
            <ExerciseInstructions 
              exerciseId={exerciseId}
              exerciseName={exerciseName}
              steps={exerciseSteps}
              tips={exerciseTips}
            />

            {/* Audio Selector */}
            <AudioSelector
              selectedAudioId={selectedAudioId}
              onSelect={setSelectedAudioId}
              recommendedId={audioRecommendation?.primary}
            />
          </ScrollView>
        ) : (
          <>
            <Text style={styles.phaseLabel}>{getPhaseLabel(currentPhase)}</Text>
            <Text style={styles.phaseTime}>{phaseTime}s</Text>
          </>
        )}

        {/* Only show breathing circle during active session */}
        {sessionState !== 'stress_prompt' && (
          <View style={styles.circleWrapper}>
            {/* Outer ring */}
            <View style={styles.outerRing}>
              {/* Progress arc would go here - simplified for now */}
              <View style={[styles.progressArc, { transform: [{ rotate: `${progress * 360}deg` }] }]} />
            </View>

            {/* Animated breathing circle */}
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.innerCircle} />
            </Animated.View>
          </View>
        )}

        {sessionState === 'playing' && (
          <View style={styles.sessionHints}>
            <Text style={styles.motivationalText}>Be present in this moment.</Text>
            <Text style={styles.helpHint}>Tap ❓ for instructions</Text>
          </View>
        )}
      </View>

      {/* Volume Control Panel */}
      {showVolumeControl && sessionState !== 'stress_prompt' && (
        <View style={styles.volumePanel}>
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
                style={[
                  styles.volumeButton,
                  audioVolume === level && styles.volumeButtonActive,
                ]}
                onPress={() => handleVolumeChange(level)}
              >
                <Ionicons 
                  name={level === 0 ? 'volume-mute' : level < 0.5 ? 'volume-low' : 'volume-high'} 
                  size={20} 
                  color={audioVolume === level ? Colors.background : Colors.textPrimary} 
                />
                <Text style={[
                  styles.volumeButtonText,
                  audioVolume === level && styles.volumeButtonTextActive,
                ]}>
                  {Math.round(level * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {presetInfo && (
            <Text style={styles.volumePresetName}>
              Playing: {presetInfo.name}
            </Text>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {sessionState !== 'stress_prompt' ? (
          <>
            <TouchableOpacity 
              style={[styles.controlButton, showVolumeControl && styles.controlButtonActive]}
              onPress={() => setShowVolumeControl(!showVolumeControl)}
            >
              <Ionicons 
                name={audioVolume === 0 ? 'volume-mute-outline' : 'volume-high-outline'} 
                size={24} 
                color={showVolumeControl ? Colors.primary : Colors.textPrimary} 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color={Colors.background}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, showExerciseInfo && styles.controlButtonActive]}
              onPress={() => setShowExerciseInfo(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handlePlayPause}>
            <Ionicons name="play" size={20} color={Colors.background} />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Info Modal */}
      {showExerciseInfo && (
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.infoModalHeader}>
                <Text style={styles.infoModalTitle}>{exerciseName}</Text>
                <View style={styles.infoOriginBadge}>
                  <Text style={styles.infoOriginFlag}>{exerciseInfo.flag}</Text>
                  <Text style={styles.infoOriginText}>{exerciseInfo.origin}</Text>
                </View>
              </View>
              
              {/* History */}
              <Text style={styles.infoHistory}>{exerciseInfo.history}</Text>
              
              {/* Steps */}
              <Text style={styles.infoSectionTitle}>How to do it</Text>
              {exerciseSteps.map((step: string, index: number) => (
                <View key={index} style={styles.infoStepRow}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.infoStepText}>{step}</Text>
                </View>
              ))}
              
              {/* Tips */}
              {exerciseTips && exerciseTips.length > 0 && (
                <>
                  <Text style={styles.infoSectionTitle}>💡 Tips</Text>
                  {exerciseTips.map((tip: string, index: number) => (
                    <Text key={index} style={styles.infoTip}>• {tip}</Text>
                  ))}
                </>
              )}
              
              {/* Benefits */}
              <Text style={styles.infoSectionTitle}>✓ Benefits</Text>
              <View style={styles.infoBenefits}>
                {exerciseInfo.benefits.map((benefit: string, idx: number) => (
                  <View key={idx} style={styles.infoBenefitBadge}>
                    <Text style={styles.infoBenefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.infoModalClose}
              onPress={() => setShowExerciseInfo(false)}
            >
              <Text style={styles.infoModalCloseText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
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
    borderWidth: 4,
    borderColor: Colors.backgroundLight,
  },
  progressArc: {
    position: 'absolute',
    top: -4,
    left: CIRCLE_SIZE / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
  sessionHints: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  motivationalText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },
  helpHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.md,
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
  stressSlider: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  stressButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  stressButtonActive: {
    backgroundColor: Colors.primary,
  },
  stressEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  stressButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  stressButtonTextActive: {
    color: Colors.background,
  },
  stressPromptContent: {
    alignItems: 'center',
    paddingBottom: 120,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
  stressHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  // Volume panel styles
  volumePanel: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
