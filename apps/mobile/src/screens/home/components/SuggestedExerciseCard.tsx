import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ExerciseWithFavorite } from '../../../types';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import { Card } from '../../../components';

interface SuggestedExerciseCardProps {
  exercise: ExerciseWithFavorite;
  onPress: () => void;
}

export const SuggestedExerciseCard: React.FC<SuggestedExerciseCardProps> = ({ exercise, onPress }) => {
  return (
    <TouchableOpacity style={styles.suggestedCardWrapper} onPress={onPress}>
      <Card style={styles.suggestedCard}>
        <View style={styles.suggestedContent}>
          <View style={[styles.suggestedIcon, styles.suggestedIconEnhanced]}>
            <Ionicons name="body-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.suggestedInfo}>
            <Text style={styles.suggestedTitle}>{exercise.name}</Text>
            <Text style={styles.suggestedDuration}>{exercise.duration_minutes} min</Text>
            <Text style={styles.suggestedCategory}>{exercise.category}</Text>
          </View>
          <View style={styles.suggestedArrow}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});
