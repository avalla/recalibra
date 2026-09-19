import { enumLabel } from '../../../i18n/labels';
import { useLanguage } from '../../../i18n/LanguageProvider';
import { tr } from '../../../i18n/core';
import { localizedExerciseName } from '../../../i18n/exercises';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { ExerciseWithFavorite } from '../../../types';
import { BorderRadius, Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../../constants';
import { useHaptics } from '../../../hooks';
import {
  FEELINGS,
  buildRecommendationSet,
  getExerciseRecommendation,
  whyLineForObjective,
  type Feeling,
} from '../../../utils/recommendation';

const TIME_OPTIONS = [2, 5, 10] as const;
type TimeOption = (typeof TIME_OPTIONS)[number];

interface FeelingEntryProps {
  exercises: ExerciseWithFavorite[];
  lastStress?: number;
  excludeIds?: string[];
  loading?: boolean;
  onBegin: (exercise: ExerciseWithFavorite) => void;
  onBrowse: () => void;
}

const capitalize = enumLabel;

const SkeletonHero: React.FC = () => {
  useLanguage();
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.heroCard} accessibilityLabel={tr("Finding your practice")}>
      <Animated.View style={[styles.skelBar, styles.skelEyebrow, pulseStyle]} />
      <Animated.View style={[styles.skelBar, styles.skelTitle, pulseStyle]} />
      <Animated.View style={[styles.skelBar, styles.skelBody, pulseStyle]} />
      <Animated.View style={[styles.skelButton, pulseStyle]} />
    </View>
  );
};

export const FeelingEntry: React.FC<FeelingEntryProps> = ({
  exercises,
  lastStress,
  excludeIds,
  loading,
  onBegin,
  onBrowse,
}) => {
  useLanguage();
  const { selection, medium } = useHaptics();
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [minutes, setMinutes] = useState<TimeOption>(5);

  const recommendation = useMemo(() => {
    if (!feeling) return null;
    const ranked = getExerciseRecommendation({
      exercises,
      objective: feeling.objective,
      minutesAvailable: minutes,
      now: new Date(),
      lastStress,
      excludeIds,
    });
    return buildRecommendationSet(ranked);
  }, [feeling, minutes, exercises, lastStress, excludeIds]);

  const handleSelectFeeling = (next: Feeling) => {
    selection();
    setFeeling(next);
  };

  const handleBegin = (exercise: ExerciseWithFavorite) => {
    medium();
    onBegin(exercise);
  };

  return (
    <View>
      <Text style={styles.prompt}>{tr("How do you feel right now?")}</Text>

      <View style={styles.feelingList}>
        {FEELINGS.map((item) => {
          const isSelected = feeling?.id === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelectFeeling(item)}
              style={({ pressed }) => [
                styles.feelingRow,
                isSelected && styles.feelingRowSelected,
                pressed && styles.feelingRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.feelingIcon, { backgroundColor: `${item.color}22` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.feelingText}>
                <Text style={styles.feelingLabel}>{tr(item.label)}</Text>
                <Text style={styles.feelingCaption}>{tr(item.caption)}</Text>
              </View>
              <Ionicons
                name={isSelected ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={Colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>

      {feeling ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.reveal}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{tr("I have")}</Text>
            {TIME_OPTIONS.map((option) => {
              const isActive = minutes === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.timeChip, isActive && styles.timeChipActive]}
                  onPress={() => {
                    selection();
                    setMinutes(option);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                    {option} {tr("min")}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {recommendation ? (
            <>
              <View style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>{tr("For you, right now")}</Text>
                <Text style={styles.heroTitle}>{localizedExerciseName(recommendation.hero.id, recommendation.hero.name)}</Text>
                <Text style={styles.heroWhy}>{tr(whyLineForObjective(feeling.objective))}</Text>
                <View style={styles.heroMetaRow}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.heroMetaText}>{recommendation.hero.duration_minutes} {tr("min")}</Text>
                  </View>
                  <View style={styles.metaDot} />
                  <Text style={styles.heroMetaText}>{capitalize(recommendation.hero.category)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.beginButton}
                  onPress={() => handleBegin(recommendation.hero)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="play" size={18} color={Colors.background} />
                  <Text style={styles.beginText}>{tr("Begin")}</Text>
                </TouchableOpacity>
              </View>

              {recommendation.alternates.length > 0 ? (
                <View style={styles.alternates}>
                  <Text style={styles.alternatesLabel}>{tr("Or try")}</Text>
                  {recommendation.alternates.map((item) => {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.alternateRow}
                        onPress={() => handleBegin(item)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.alternateInfo}>
                          <Text style={styles.alternateTitle} numberOfLines={1}>
                            {localizedExerciseName(item.id, item.name)}
                          </Text>
                          <Text style={styles.alternateMeta}>
                            {item.duration_minutes} {tr("min ·")} {' '}{capitalize(item.category)}
                          </Text>
                        </View>
                        <Ionicons name="play-circle-outline" size={22} color={Colors.primary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </>
          ) : loading ? (
            <SkeletonHero />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{tr("Nothing fits that time right now.")}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.browseLink} onPress={onBrowse} activeOpacity={0.7}>
            <Text style={styles.browseText}>{tr("Browse all exercises")}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  prompt: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.lg,
  },
  feelingList: {
    gap: Spacing.sm,
  },
  feelingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feelingRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundElevated,
  },
  feelingRowPressed: {
    opacity: 0.85,
  },
  feelingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingText: {
    flex: 1,
  },
  feelingLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  feelingCaption: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  reveal: {
    marginTop: Spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginRight: Spacing.xs,
  },
  timeChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: `${Colors.primary}1F`,
    borderColor: Colors.primary,
  },
  timeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  timeChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  heroCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroEyebrow: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.heading,
  },
  heroWhy: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.textMuted,
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  beginText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  alternates: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  alternatesLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  alternateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  alternateInfo: {
    flex: 1,
  },
  alternateTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  alternateMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  browseLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  browseText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  skelBar: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.sm,
  },
  skelEyebrow: {
    width: 96,
    height: 10,
  },
  skelTitle: {
    width: '68%',
    height: 22,
    marginTop: Spacing.md,
  },
  skelBody: {
    width: '100%',
    height: 12,
    marginTop: Spacing.md,
  },
  skelButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    marginTop: Spacing.lg,
  },
});
