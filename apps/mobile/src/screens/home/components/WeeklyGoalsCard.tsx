import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface WeeklyGoalsCardProps {
  goals: { sessionGoal: number; minutesGoal: number };
  weekProgress: {
    sessionsCompleted: number;
    minutesCompleted: number;
    sessionProgress: number;
    minutesProgress: number;
    sessionGoalMet: boolean;
    minutesGoalMet: boolean;
  };
  fadeStyle: unknown;
}

export const WeeklyGoalsCard: React.FC<WeeklyGoalsCardProps> = ({ goals, weekProgress, fadeStyle }) => {
  const Gradient = LinearGradient as unknown as React.ComponentType<any>;

  return (
    <Gradient colors={[Colors.backgroundCard, Colors.backgroundCard + 'CC']} style={styles.goalsCardGradient}>
      <View style={styles.goalsCard}>
        <Animated.View style={[styles.goalRow, fadeStyle as any]}>
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
                    backgroundColor: weekProgress.sessionGoalMet ? Colors.success : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.goalPercentage}>{Math.round(weekProgress.sessionProgress * 100)}%</Text>
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

        <Animated.View style={[styles.goalRow, fadeStyle as any]}>
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
                    backgroundColor: weekProgress.minutesGoalMet ? Colors.success : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.goalPercentage}>{Math.round(weekProgress.minutesProgress * 100)}%</Text>
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
    </Gradient>
  );
};

const styles = StyleSheet.create({
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
});
