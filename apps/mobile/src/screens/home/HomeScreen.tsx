import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button, Card } from '../../components';
import { useAuth } from '../../contexts';
import { useSessions, useExercises, useGoals } from '../../hooks';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userMetadata } = useAuth();
  const { sessions, getSessionStats } = useSessions();
  const { exercises } = useExercises();
  const { goals, weekProgress } = useGoals();

  // Get first name from full name
  const userName = userMetadata?.full_name?.split(' ')[0] || 'there';
  
  // Random greeting phrase (memoized to stay consistent during session)
  const greetingPhrase = useMemo(() => {
    return GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)];
  }, []);
  
  // Get stats
  const stats = getSessionStats();
  const lastSession = sessions[0];
  
  // Get a suggested exercise (random breathing exercise for now)
  const suggestedExercise = exercises.find((e) => e.category === 'breathing') || exercises[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="leaf" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>VagoFlow</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Hi {userName},</Text>
          <Text style={styles.greetingTitle}>{greetingPhrase}</Text>
        </View>

        {/* Weekly Goals */}
        <Text style={styles.sectionTitle}>Weekly Goals</Text>
        <Card style={styles.goalsCard}>
          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Sessions</Text>
              <Text style={styles.goalProgress}>
                {weekProgress.sessionsCompleted}/{goals.sessionGoal}
              </Text>
            </View>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  { width: `${weekProgress.sessionProgress * 100}%` },
                  weekProgress.sessionGoalMet && styles.goalBarComplete
                ]} 
              />
            </View>
            {weekProgress.sessionGoalMet && (
              <Text style={styles.goalCheck}>✓</Text>
            )}
          </View>
          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Minutes</Text>
              <Text style={styles.goalProgress}>
                {weekProgress.minutesCompleted}/{goals.minutesGoal}
              </Text>
            </View>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  { width: `${weekProgress.minutesProgress * 100}%` },
                  weekProgress.minutesGoalMet && styles.goalBarComplete
                ]} 
              />
            </View>
            {weekProgress.minutesGoalMet && (
              <Text style={styles.goalCheck}>✓</Text>
            )}
          </View>
        </Card>

        {/* Today's Status */}
        <Text style={styles.sectionTitle}>Today's status</Text>
        <View style={styles.statusCards}>
          <Card style={styles.statusCard}>
            <Text style={styles.statusLabel}>Sessions</Text>
            <Text style={styles.statusValue}>{stats.totalSessions}</Text>
          </Card>
          <Card style={styles.statusCard}>
            <Text style={styles.statusLabel}>Minutes</Text>
            <Text style={styles.statusValue}>{stats.totalMinutes}</Text>
          </Card>
        </View>

        {/* Start Session Button */}
        <Button
          label="Start a Session"
          onPress={() => navigation.navigate('ExercisesTab', {
            screen: 'ExerciseCatalog',
          })}
          style={styles.startButton}
        />

        {/* Suggested Exercise */}
        <Text style={styles.sectionTitle}>Suggested for you today</Text>
        {suggestedExercise && (
          <Card 
            style={styles.suggestedCard} 
            onPress={() => navigation.navigate('ExercisesTab', {
              screen: 'ExerciseSession',
              params: { 
                exerciseId: suggestedExercise.id,
                exerciseName: suggestedExercise.name,
                durationMinutes: suggestedExercise.duration_minutes,
                audioPreset: suggestedExercise.audio_preset || 'silence',
                exerciseCategory: suggestedExercise.category,
              }
            })}
          >
            <View style={styles.suggestedContent}>
              <View style={styles.suggestedIcon}>
                <Ionicons name="body-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.suggestedInfo}>
                <Text style={styles.suggestedTitle}>{suggestedExercise.name}</Text>
                <Text style={styles.suggestedDuration}>{suggestedExercise.duration_minutes} min</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </Card>
        )}

        {/* Your Progress */}
        <Text style={styles.sectionTitle}>Your progress</Text>
        <View style={styles.progressCards}>
          <Card style={styles.progressCard}>
            <Text style={styles.progressLabel}>Last session</Text>
            {lastSession ? (
              <>
                <Text style={styles.progressValue}>{lastSession.exercise?.name || 'Exercise'}</Text>
                <Text style={styles.progressSubValue}>{Math.round(lastSession.duration_seconds / 60)} min</Text>
              </>
            ) : (
              <Text style={styles.progressValue}>No sessions yet</Text>
            )}
          </Card>
          <Card style={styles.progressCard}>
            <Text style={styles.progressLabel}>Avg. stress reduction</Text>
            <Text style={styles.progressValue}>
              {stats.avgStressReduction > 0 ? `-${stats.avgStressReduction}` : '--'}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  greeting: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  greetingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  statusCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusCard: {
    flex: 1,
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  startButton: {
    marginTop: Spacing.lg,
  },
  suggestedCard: {
    backgroundColor: Colors.backgroundElevated,
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
  progressCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  progressCard: {
    flex: 1,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  progressValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  progressSubValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
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
  // Goal styles
  goalsCard: {
    paddingVertical: Spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalInfo: {
    width: 80,
  },
  goalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  goalProgress: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  goalBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  goalBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  goalBarComplete: {
    backgroundColor: Colors.success,
  },
  goalCheck: {
    color: Colors.success,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
