import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Line, Circle, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, Screen } from '../../components';
import { useAuth } from '../../contexts';
import { useSessions, useExercises, useGoals } from '../../hooks';
import {
  getExerciseForQuickStart,
  loadQuickStartPreference,
  toExerciseSessionParams,
  type QuickStartPreference,
} from '../../utils/quick-start';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

// Motivational greeting phrases
const GREETING_PHRASES = [
  "let's recalibrate",
  "time to breathe",
  "find your calm",
  "let's reset",
  "take a moment",
  "breathe with me",
  "let's slow down",
  "find your center",
  "time to unwind",
  "let's recharge",
  "relax and breathe",
  "let's reconnect",
  "pause and reset",
  "find your peace",
  "let's decompress",
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userMetadata } = useAuth();
  const { sessions, getSessionStats, refetch: refreshSessions } = useSessions();
  const { exercises } = useExercises();
  const { goals, weekProgress } = useGoals();
  const [refreshing, setRefreshing] = useState(false);
  const [quickStartPreference, setQuickStartPreference] = useState<QuickStartPreference | null>(null);

  // Animation values
  const breatheScale = useSharedValue(1);
  const fadeValue = useSharedValue(0);
  
  // Breathing animation for the main button
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  // Fade in animation on mount
  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
  }, []);
  
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale.value }],
    };
  });
  
  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
    };
  });

  // Get first name from full name
  const userName = userMetadata?.full_name?.split(' ')[0] || 'there';
  
  // Random greeting phrase (memoized to stay consistent during session)
  const greetingPhrase = useMemo(() => {
    return GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)];
  }, []);
  
  // Get stats
  const stats = getSessionStats();
  const lastSession = sessions[0];

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const pref = await loadQuickStartPreference();
        setQuickStartPreference(pref);
      };
      load();
      return () => {};
    }, [])
  );
  
  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };
  
  // Generate mock stress trend data (last 7 days)
  const stressTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
      value: Math.floor(Math.random() * 40) + 20, // 20-60 stress level
    }));
  }, []);

  const suggestedExercise = useMemo(() => {
    return exercises.find((e) => e.category === 'breathing') || exercises[0];
  }, [exercises]);
  
  const handleQuickStart = () => {
    if (!quickStartPreference) {
      navigation.navigate('QuickStartPreferences', { from: 'home' });
      return;
    }

    const exercise = getExerciseForQuickStart(quickStartPreference, exercises, {
      now: new Date(),
      lastStressLevel:
        (lastSession as any)?.post_stress_level ?? (lastSession as any)?.pre_stress_level,
    });

    if (!exercise) {
      navigation.navigate('QuickStartPreferences', { from: 'home' });
      return;
    }

    navigation.navigate('Main', {
      screen: 'ExercisesTab',
      params: {
        screen: 'ExerciseSession',
        params: toExerciseSessionParams(exercise),
      },
    });
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="leaf" size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>Recalibra</Text>
          </View>
          <TouchableOpacity
            onPress={handleQuickStart}
            style={styles.quickStartButton}
            activeOpacity={0.85}
          >
            {/* @ts-ignore - LinearGradient type issue with React 19 */}
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStartGradient}
            >
              <Ionicons name="flash" size={16} color={Colors.background} style={styles.quickStartIcon} />
              <Text style={styles.quickStartText}>Quick Start</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Greeting with gradient background */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          {/* @ts-ignore - LinearGradient type issue with React 19 */}
          <LinearGradient
            colors={[Colors.primary + '20', Colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.greetingGradient}
          >
            <View style={styles.greeting}>
              <Text style={styles.greetingTitle}>Hi {userName},</Text>
              <Text style={styles.greetingSubtitle}>{greetingPhrase}</Text>
              <View style={styles.greetingAccent} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Weekly Goals */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionTitle}>Weekly Goals</Text>
          {/* @ts-ignore - LinearGradient type issue with React 19 */}
          <LinearGradient
            colors={[Colors.backgroundCard, Colors.backgroundCard + 'CC']}
            style={styles.goalsCardGradient}
          >
            <View style={styles.goalsCard}>
              <Animated.View style={[styles.goalRow, fadeStyle]}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Sessions</Text>
                  <Text style={styles.goalProgress}>
                    {weekProgress.sessionsCompleted}/{goals.sessionGoal}
                  </Text>
                </View>
                <View style={styles.goalBarContainer}>
                  <View style={styles.goalBarBackground}>
                    <Animated.View 
                      style={[
                        styles.goalBar, 
                        { 
                          width: `${Math.min(weekProgress.sessionProgress * 100, 100)}%`,
                          backgroundColor: weekProgress.sessionGoalMet ? Colors.success : Colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.goalPercentage}>
                    {Math.round(weekProgress.sessionProgress * 100)}%
                  </Text>
                </View>
                {weekProgress.sessionGoalMet && (
                  <Animated.View entering={FadeIn.delay(400)}>
                    <View style={styles.goalCheckContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
              
              <View style={styles.goalDivider} />
              
              <Animated.View style={[styles.goalRow, fadeStyle]}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Minutes</Text>
                  <Text style={styles.goalProgress}>
                    {weekProgress.minutesCompleted}/{goals.minutesGoal}
                  </Text>
                </View>
                <View style={styles.goalBarContainer}>
                  <View style={styles.goalBarBackground}>
                    <Animated.View 
                      style={[
                        styles.goalBar, 
                        { 
                          width: `${Math.min(weekProgress.minutesProgress * 100, 100)}%`,
                          backgroundColor: weekProgress.minutesGoalMet ? Colors.success : Colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.goalPercentage}>
                    {Math.round(weekProgress.minutesProgress * 100)}%
                  </Text>
                </View>
                {weekProgress.minutesGoalMet && (
                  <Animated.View entering={FadeIn.delay(400)}>
                    <View style={styles.goalCheckContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Today's Status */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={styles.sectionTitle}>Today's status</Text>
          <View style={styles.statusCards}>
            <Animated.View entering={FadeIn.delay(500).duration(300)}>
              <Card style={styles.statusCardEnhanced}>
                <Ionicons name="fitness-outline" size={20} color={Colors.primary} style={styles.statusIcon} />
                <Text style={styles.statusLabel}>Sessions</Text>
                <Text style={styles.statusValue}>{stats.totalSessions}</Text>
                <View style={styles.statusAccent} />
              </Card>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(600).duration(300)}>
              <Card style={styles.statusCardEnhanced}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} style={styles.statusIcon} />
                <Text style={styles.statusLabel}>Minutes</Text>
                <Text style={styles.statusValue}>{stats.totalMinutes}</Text>
                <View style={styles.statusAccent} />
              </Card>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Start Session Button */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <Animated.View style={[animatedButtonStyle, styles.startButtonContainer]}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'ExercisesTab',
                  params: {
                    screen: 'ExerciseCatalog',
                  },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.startButtonContent}>
                <Ionicons name="play" size={24} color={Colors.background} style={styles.startIcon} />
                <Text style={styles.startButtonText}>Start a Session</Text>
              </View>
              <View style={styles.startButtonGradient} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Suggested Exercise */}
        <Animated.View entering={FadeInDown.delay(800).duration(500)}>
          <Text style={styles.sectionTitle}>Suggested for you today</Text>
          {suggestedExercise && (
            <TouchableOpacity
              style={styles.suggestedCardWrapper}
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'ExercisesTab',
                  params: {
                    screen: 'ExerciseSession',
                    params: {
                      exerciseId: suggestedExercise.id,
                      exerciseName: suggestedExercise.name,
                      durationMinutes: suggestedExercise.duration_minutes,
                      audioPreset: suggestedExercise.audio_preset || 'silence',
                      exerciseCategory: suggestedExercise.category,
                      breathingPattern: suggestedExercise.breathing_pattern,
                      origin: suggestedExercise.origin || 'universal',
                      history: suggestedExercise.history || '',
                      benefits: suggestedExercise.benefits || [],
                      tips: suggestedExercise.tips || [],
                      instructions: suggestedExercise.instructions || [],
                    },
                  },
                })
              }
            >
              <Card style={styles.suggestedCard}>
                <View style={styles.suggestedContent}>
                  <View style={[styles.suggestedIcon, styles.suggestedIconEnhanced]}>
                    <Ionicons name="body-outline" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.suggestedInfo}>
                    <Text style={styles.suggestedTitle}>{suggestedExercise.name}</Text>
                    <Text style={styles.suggestedDuration}>{suggestedExercise.duration_minutes} min</Text>
                    <Text style={styles.suggestedCategory}>{suggestedExercise.category}</Text>
                  </View>
                  <View style={styles.suggestedArrow}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Stress Trend */}
        <Animated.View entering={FadeInDown.delay(900).duration(500)}>
          <Text style={styles.sectionTitle}>Stress Trend</Text>
          {/* @ts-ignore - LinearGradient type issue with React 19 */}
          <LinearGradient
            colors={[Colors.backgroundCard, Colors.backgroundCard + 'CC']}
            style={styles.chartCardGradient}
          >
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Ionicons name="trending-down-outline" size={20} color={Colors.primary} />
                <Text style={styles.chartTitle}>Last 7 days</Text>
                <Text style={styles.chartValue}>
                  {stats.avgStressReduction > 0 ? `-${stats.avgStressReduction}%` : 'No data'}
                </Text>
              </View>
              <View style={styles.chartContainer}>
                <Svg width="100%" height={120}>
                  {/* Grid lines */}
                  {Array.from({ length: 4 }, (_, i) => (
                    <Line
                      key={i}
                      x1="0"
                      y1={i * 30}
                      x2="100%"
                      y2={i * 30}
                      stroke={Colors.border}
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}
                  {/* Stress trend line */}
                  <Polyline
                    points={stressTrend
                      .map((point, index) => {
                        const x = (index / (stressTrend.length - 1)) * 100;
                        const y = 120 - (point.value / 80) * 120;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    stroke={Colors.primary}
                    strokeWidth="3"
                    fill="none"
                  />
                  {/* Data points */}
                  {stressTrend.map((point, index) => {
                    const x = (index / (stressTrend.length - 1)) * 100;
                    const y = 120 - (point.value / 80) * 120;
                    return (
                      <Circle
                        key={index}
                        cx={x + '%'}
                        cy={y}
                        r="4"
                        fill={Colors.primary}
                        stroke={Colors.background}
                        strokeWidth="2"
                      />
                    );
                  })}
                </Svg>
                <View style={styles.chartLabels}>
                  {stressTrend.map((point, index) => (
                    <Text key={index} style={styles.chartLabel}>
                      {point.day}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
  },
  quickStartButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  quickStartIcon: {
    marginRight: 6,
  },
  quickStartText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  greeting: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  greetingGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: 0,
  },
  greetingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    fontFamily: FontFamily.heading,
  },
  greetingSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
  greetingAccent: {
    position: 'absolute',
    left: -10,
    bottom: -5,
    width: 60,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    opacity: 0.3,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalsCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: 1,
  },
  goalsCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg - 1,
    padding: Spacing.lg,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  goalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  goalProgress: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  goalBarContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  goalBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  goalBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  goalPercentage: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    minWidth: 35,
    textAlign: 'right',
  },
  goalCheckContainer: {
    marginLeft: Spacing.sm,
  },
  chartCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: 1,
    marginHorizontal: 0,
  },
  chartCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg - 1,
    padding: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  chartValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  chartLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  statusCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusCardEnhanced: {
    flex: 1,
    paddingVertical: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  statusIcon: {
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statusAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  // Enhanced Start Button
  startButtonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  startIcon: {
    marginLeft: Spacing.xs,
  },
  startButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Enhanced Suggested Card
  suggestedCardWrapper: {
    backgroundColor: Colors.backgroundElevated,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  suggestedCard: {
    backgroundColor: 'transparent',
  },
  suggestedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  suggestedIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedIconEnhanced: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  suggestedDuration: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  suggestedCategory: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  suggestedArrow: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
  },
  // Enhanced Progress Cards
  progressCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  progressCardEnhanced: {
    flex: 1,
    paddingVertical: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  progressIcon: {
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  progressSubValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  progressAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  weekDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  weekDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  weekDotCompleted: {
    backgroundColor: Colors.primary,
  },
  weekDotPending: {
    backgroundColor: Colors.backgroundLight,
  },
});
