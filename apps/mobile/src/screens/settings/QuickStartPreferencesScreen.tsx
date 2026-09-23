import { enumLabel } from '../../i18n/labels';
import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import { localizedExerciseName } from '../../i18n/exercises';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Card, Screen } from '../../components';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { useExercises } from '../../hooks';
import type { ExerciseWithFavorite, RootStackParamList } from '../../types';
import {
  getExerciseForQuickStart,
  loadQuickStartPreference,
  saveQuickStartPreference,
  type QuickStartMode,
  type QuickStartPreference,
} from '@/utils/quick-start';

type QuickStartRouteProps = RouteProp<RootStackParamList, 'QuickStartPreferences'>;

export const QuickStartPreferencesScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<QuickStartRouteProps>();
  const { exercises } = useExercises();

  const [selectedMode, setSelectedMode] = useState<QuickStartMode>('standard_2min');
  const [favoriteExerciseId, setFavoriteExerciseId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    const load = async () => {
      const pref = await loadQuickStartPreference();
      if (!pref) return;
      setSelectedMode(pref.mode);
      setFavoriteExerciseId(pref.favoriteExerciseId);
    };
    load();
  }, []);

  const favorites = useMemo(() => exercises.filter((e) => e.is_favorite), [exercises]);

  const selectedFavorite = useMemo(() => {
    if (!favoriteExerciseId) return undefined;
    return exercises.find((e) => e.id === favoriteExerciseId);
  }, [exercises, favoriteExerciseId]);

  const canSave = useMemo(() => {
    if (selectedMode !== 'favorite') return true;
    return !!favoriteExerciseId;
  }, [favoriteExerciseId, selectedMode]);

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert(tr("Choose a favorite"), tr("Select your favorite exercise to use for Quick Start."));
      return;
    }

    const preference: QuickStartPreference = {
      mode: selectedMode,
      favoriteExerciseId: selectedMode === 'favorite' ? favoriteExerciseId : undefined,
    };

    await saveQuickStartPreference(preference);

    if (route.params?.from === 'home') {
      const exercise = getExerciseForQuickStart(preference, exercises, {
        now: new Date(),
      });

      if (!exercise) {
        navigation.goBack();
        return;
      }

      navigation.navigate(exercise.safety_warning ? 'ExerciseSafety' : 'ExercisePreparation', {
        exerciseId: exercise.id,
      });
      return;
    }

    navigation.goBack();
  };

  const renderModeOption = (
    mode: QuickStartMode,
    title: string,
    description: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const isSelected = selectedMode === mode;

    const cardStyle = isSelected ? styles.optionCardSelected : undefined;

    return (
      <TouchableOpacity
        onPress={() => setSelectedMode(mode)}
        activeOpacity={0.85}
        style={styles.optionWrapper}
        accessibilityRole="radio"
        accessibilityLabel={title}
        accessibilityState={{ selected: isSelected }}
      >
        <Card
          style={cardStyle ? { ...styles.optionCard, ...cardStyle } : styles.optionCard}
          gradientKey={isSelected ? 'primary' : undefined}
        >
          <View style={styles.optionRow}>
            <View style={styles.optionIcon}>
              <Ionicons
                name={icon}
                size={20}
                color={isSelected ? Colors.background : Colors.primary}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                {tr(title)}
              </Text>
              <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                {tr(description)}
              </Text>
            </View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={20} color={Colors.background} />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color={Colors.textMuted} />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFavoritePicker = () => {
    if (selectedMode !== 'favorite') return null;

    return (
      <View style={styles.favoriteSection}>
        <Text style={styles.sectionLabel}>{tr("Your favorite")}</Text>

        {favorites.length === 0 ? (
          <Card variant="soft" style={styles.favoriteEmpty}>
            <Text style={styles.favoriteEmptyText}>{tr("You don't have any favorites yet.")}</Text>
            <Text style={styles.favoriteEmptyTextSecondary}>
              {tr("Add a favorite from the Exercises tab, then come back here.")}</Text>
          </Card>
        ) : (
          <View style={styles.favoriteList}>
            {favorites.map((exercise: ExerciseWithFavorite) => {
              const isSelected = favoriteExerciseId === exercise.id;

              const cardStyle = isSelected ? styles.favoriteItemSelected : undefined;
              return (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => setFavoriteExerciseId(exercise.id)}
                  activeOpacity={0.85}
                  style={styles.favoriteItemWrapper}
                  accessibilityRole="radio"
                  accessibilityLabel={exercise.name}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Card
                    variant="soft"
                    style={cardStyle ? { ...styles.favoriteItem, ...cardStyle } : styles.favoriteItem}
                  >
                    <View style={styles.favoriteItemRow}>
                      <View style={styles.favoriteItemText}>
                        <Text style={styles.favoriteItemTitle}>{localizedExerciseName(exercise.id, exercise.name)}</Text>
                        <Text style={styles.favoriteItemMeta}>
                          {exercise.duration_minutes} {tr("min •")} {' '}{enumLabel(exercise.category)}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedFavorite ? (
          <Text style={styles.favoriteSelectedHint}>{tr("Selected:")} {' '}{localizedExerciseName(selectedFavorite.id, selectedFavorite.name)}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Close Quick Start"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr("Quick Start")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{tr("Choose your default Quick Start")}</Text>
        <Text style={styles.subtitle}>
          {tr("You can change this anytime from Settings.")}</Text>

        {renderModeOption(
          'standard_2min',
          'Standard 2-minute exercise',
          'A simple, short exercise to reset your nervous system.',
          'timer-outline'
        )}

        {renderModeOption(
          'favorite',
          'My favorite exercise',
          'Start the exercise you selected as your favorite.',
          'heart-outline'
        )}

        {renderFavoritePicker()}

        {renderModeOption(
          'smart',
          'Recommended (smart)',
          'We pick the best exercise based on time of day and your recent stress.',
          'sparkles-outline'
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.9}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={route.params?.from === 'home' ? 'Save and start' : 'Save'}
          accessibilityState={{ disabled: !canSave }}
        >
          <Text style={styles.saveButtonText}>
            {route.params?.from === 'home' ? tr("Save & Start") : tr("Save")}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  optionWrapper: {
    marginBottom: Spacing.md,
  },
  optionCard: {
    borderRadius: BorderRadius.lg,
  },
  optionCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.0)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(15, 26, 25, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  optionTitleSelected: {
    color: Colors.background,
  },
  optionDescription: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  optionDescriptionSelected: {
    color: 'rgba(15, 26, 25, 0.85)',
  },
  favoriteSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  favoriteEmpty: {
    paddingVertical: Spacing.md,
  },
  favoriteEmptyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  favoriteEmptyTextSecondary: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  favoriteList: {
    gap: Spacing.sm,
  },
  favoriteItemWrapper: {
    width: '100%',
  },
  favoriteItem: {
    borderRadius: BorderRadius.lg,
  },
  favoriteItemSelected: {
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  favoriteItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteItemText: {
    flex: 1,
  },
  favoriteItemTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  favoriteItemMeta: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  favoriteSelectedHint: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  saveButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
