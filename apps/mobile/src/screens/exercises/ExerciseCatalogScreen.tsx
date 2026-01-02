import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, ExerciseIllustration } from '../../components';
import { useExercises, useSessions, useSubscription } from '../../hooks';
import type { ExerciseWithFavorite, ExerciseCategory, ExerciseObjective, ExerciseLevel } from '../../types';

const CATEGORIES: { id: ExerciseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: 'leaf-outline', color: '#4ECDC4' },
  { id: 'water', label: 'Water', icon: 'water-outline', color: '#45B7D1' },
  { id: 'movement', label: 'Movement', icon: 'body-outline', color: '#96CEB4' },
  { id: 'sensory', label: 'Sensory', icon: 'ear-outline', color: '#DDA0DD' },
];

const OBJECTIVES: {
  id: ExerciseObjective;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { id: 'relax', label: 'Relax', subtitle: 'Calm down & reset', icon: 'leaf-outline', color: '#4ECDC4' },
  { id: 'energy', label: 'Energy', subtitle: 'Boost & wake up', icon: 'flash-outline', color: '#F59E0B' },
  { id: 'focus', label: 'Focus', subtitle: 'Clarity & attention', icon: 'sparkles-outline', color: '#60A5FA' },
  { id: 'sleep', label: 'Sleep', subtitle: 'Wind down', icon: 'moon-outline', color: '#A78BFA' },
];

export const ExerciseCatalogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { exercises, isLoading, toggleFavorite } = useExercises();
  const { sessions } = useSessions();
  const { canAccessExercise, presentPaywall } = useSubscription();
  const [showCatalog, setShowCatalog] = useState(false);
  const [isGuidedResults, setIsGuidedResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const [guidedStep, setGuidedStep] = useState<1 | 2 | 3>(1);
  const [guidedObjective, setGuidedObjective] = useState<ExerciseObjective | null>(null);
  const [guidedMinutes, setGuidedMinutes] = useState<3 | 5 | 10 | null>(null);
  const [guidedAvoidWater, setGuidedAvoidWater] = useState(false);
  const [guidedIntensity, setGuidedIntensity] = useState<'gentle' | 'energizing' | null>(null);

  const applyGuidedFiltersAndBrowse = () => {
    setSearchQuery('');
    setSelectedCategory(guidedAvoidWater ? 'breathing' : 'all');

    if (guidedMinutes === 3) setSelectedDuration('short');
    if (guidedMinutes === 5) setSelectedDuration('medium');
    if (guidedMinutes === 10) setSelectedDuration('long');

    const nextLevel: ExerciseLevel | 'all' = guidedIntensity === 'gentle' ? 'beginner' : 'all';
    setSelectedLevel(nextLevel);

    setIsGuidedResults(true);
    setShowCatalog(true);
  };

  const guidedSummaryLabels = useMemo(() => {
    if (!guidedObjective || !guidedMinutes) return [];

    const objectiveLabel = OBJECTIVES.find((o) => o.id === guidedObjective)?.label ?? guidedObjective;
    const labels: string[] = [`${objectiveLabel}`, `${guidedMinutes} min`];

    if (guidedIntensity === 'gentle') labels.push('Gentle');
    if (guidedIntensity === 'energizing') labels.push('Energizing');
    if (guidedAvoidWater) labels.push('No water');

    return labels;
  }, [guidedAvoidWater, guidedIntensity, guidedMinutes, guidedObjective]);

  const renderShelfItem = ({ item }: { item: ExerciseWithFavorite }) => {
    const isLocked = !canAccessExercise(item.name, item.is_premium);

    return (
      <Card
        style={isLocked ? { ...styles.shelfCard, ...styles.exerciseCardLocked } : styles.shelfCard}
        onPress={() => handleExercisePress(item)}
      >
        <View style={styles.cardThumbnailWrap}>
          <ExerciseIllustration exercise={item} variant="card" style={styles.cardThumbnail} />
        </View>
        <View style={styles.shelfTopRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.duration_minutes} min</Text>
          </View>
          {isLocked ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.warning} />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={item.is_favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={item.is_favorite ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.shelfTitle, isLocked && styles.exerciseNameLocked]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.shelfSubtitle} numberOfLines={2}>
          {item.description}
        </Text>
      </Card>
    );
  };

  const renderGridItem = ({ item }: { item: ExerciseWithFavorite }) => {
    const isLocked = !canAccessExercise(item.name, item.is_premium);

    return (
      <View style={styles.gridItemWrapper}>
        <Card
          style={isLocked ? { ...styles.gridCard, ...styles.exerciseCardLocked } : styles.gridCard}
          onPress={() => handleExercisePress(item)}
        >
          <View style={styles.cardThumbnailWrapGrid}>
            <ExerciseIllustration exercise={item} variant="card" style={styles.cardThumbnail} />
          </View>
          <View style={styles.gridTopRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.duration_minutes} min</Text>
            </View>
            {isLocked ? (
              <View style={styles.premiumBadge}>
                <Ionicons name="lock-closed" size={12} color={Colors.warning} />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
                <Ionicons
                  name={item.is_favorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={item.is_favorite ? Colors.primary : Colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.gridTitle, isLocked && styles.exerciseNameLocked]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.gridSubtitle} numberOfLines={2}>
            {item.description}
          </Text>
        </Card>
      </View>
    );
  };

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return exercises.filter((e) => {
      if (normalizedQuery) {
        const matchesQuery =
          e.name.toLowerCase().includes(normalizedQuery) ||
          (e.description ? e.description.toLowerCase().includes(normalizedQuery) : false);
        if (!matchesQuery) return false;
      }

      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      if (guidedAvoidWater && e.category === 'water') return false;

      if (guidedObjective && e.objective !== guidedObjective) return false;

      if (guidedIntensity === 'gentle') {
        if (e.level !== 'beginner') return false;
        if (e.category === 'movement') return false;
        const special = e.breathing_pattern?.special;
        if (special === 'wim_hof' || special === 'rapid' || special === 'holotropic') return false;
      }

      if (guidedIntensity === 'energizing') {
        if (e.level === 'beginner') return false;
        const special = e.breathing_pattern?.special;
        if (special === 'humming') return false;
      }

      if (selectedLevel !== 'all' && e.level !== selectedLevel) return false;

      if (selectedDuration !== 'all') {
        const minutes = e.duration_minutes;
        if (selectedDuration === 'short' && minutes > 3) return false;
        if (selectedDuration === 'medium' && (minutes < 4 || minutes > 7)) return false;
        if (selectedDuration === 'long' && minutes < 8) return false;
      }

      return true;
    });
  }, [
    exercises,
    searchQuery,
    selectedCategory,
    selectedDuration,
    selectedLevel,
    guidedAvoidWater,
    guidedObjective,
    guidedIntensity,
  ]);

  const recentExercises = useMemo(() => {
    const seen = new Set<string>();
    const recent: ExerciseWithFavorite[] = [];

    for (const s of sessions) {
      if (!s.exercise_id) continue;
      if (seen.has(s.exercise_id)) continue;
      seen.add(s.exercise_id);

      const ex = exercises.find((e) => e.id === s.exercise_id);
      if (!ex) continue;
      recent.push(ex);
      if (recent.length >= 10) break;
    }

    return recent;
  }, [sessions, exercises]);

  const favoriteExercises = useMemo(() => {
    return exercises.filter((e) => e.is_favorite).slice(0, 12);
  }, [exercises]);

  const categoryCounts = useMemo(() => {
    const counts: Record<ExerciseCategory, number> = {
      breathing: 0,
      water: 0,
      movement: 0,
      sensory: 0,
    };

    for (const e of exercises) {
      counts[e.category] += 1;
    }

    return counts;
  }, [exercises]);

  const handleExercisePress = async (exercise: ExerciseWithFavorite) => {
    // Check if user can access this exercise
    if (!canAccessExercise(exercise.name, exercise.is_premium)) {
      // Show RevenueCat paywall
      const purchased = await presentPaywall();
      if (!purchased) return;
    }

    navigation.navigate('ExerciseDetail', {
      exerciseId: exercise.id,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!showCatalog ? (
        <ScrollView style={styles.simpleFlow} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            {/* @ts-ignore - LinearGradient type issue with React 19 */}
            <LinearGradient
              colors={['#667EEA', '#764BA2'] as any}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Find the right exercise</Text>
              <Text style={styles.heroTitle}>What do you need right now?</Text>
              <Text style={styles.heroSubtitle}>
                Answer 3 quick questions and we’ll surface the best matches.
              </Text>

              {guidedStep === 1 ? (
                <View style={styles.guidedOptionsGrid}>
                  {OBJECTIVES.map((o) => {
                    const isSelected = guidedObjective === o.id;
                    return (
                      <TouchableOpacity
                        key={o.id}
                        style={isSelected ? [styles.guidedOptionCard, styles.guidedOptionCardSelected] : styles.guidedOptionCard}
                        onPress={() => {
                          setGuidedObjective(o.id);
                          setGuidedStep(2);
                        }}
                        activeOpacity={0.9}
                      >
                        <View style={[styles.guidedOptionIcon, { backgroundColor: `${o.color}22` }]}>
                          <Ionicons name={o.icon} size={20} color={o.color} />
                        </View>
                        <View style={styles.guidedOptionText}>
                          <Text style={styles.guidedOptionTitle}>{o.label}</Text>
                          <Text style={styles.guidedOptionSubtitle}>{o.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.background + 'CC'} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {guidedStep === 2 ? (
                <View style={styles.guidedStepBlock}>
                  <Text style={styles.guidedStepTitle}>How much time do you have?</Text>
                  <View style={styles.timeButtons}>
                    <TouchableOpacity
                      style={guidedMinutes === 3 ? [styles.timeButton, styles.timeButtonSelected] : styles.timeButton}
                      onPress={() => {
                        setGuidedMinutes(3);
                        setGuidedStep(3);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.timeButtonText}>3 min</Text>
                      <Text style={styles.timeButtonSubtext}>Quick</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={guidedMinutes === 5 ? [styles.timeButton, styles.timeButtonSelected] : styles.timeButton}
                      onPress={() => {
                        setGuidedMinutes(5);
                        setGuidedStep(3);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.timeButtonText}>5 min</Text>
                      <Text style={styles.timeButtonSubtext}>Standard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={guidedMinutes === 10 ? [styles.timeButton, styles.timeButtonSelected] : styles.timeButton}
                      onPress={() => {
                        setGuidedMinutes(10);
                        setGuidedStep(3);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.timeButtonText}>10 min</Text>
                      <Text style={styles.timeButtonSubtext}>Deep</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.guidedBackLink} onPress={() => setGuidedStep(1)}>
                    <Ionicons name="arrow-back" size={18} color={Colors.background + 'CC'} />
                    <Text style={styles.guidedBackText}>Back</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {guidedStep === 3 ? (
                <View style={styles.guidedStepBlock}>
                  <Text style={styles.guidedStepTitle}>Anything else?</Text>

                  <TouchableOpacity
                    style={guidedAvoidWater ? [styles.guidedToggle, styles.guidedToggleSelected] : styles.guidedToggle}
                    onPress={() => setGuidedAvoidWater((v) => !v)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.guidedToggleLeft}>
                      <Ionicons name="water-outline" size={18} color={Colors.background} />
                      <Text style={styles.guidedToggleText}>Avoid water-based exercises</Text>
                    </View>
                    <Ionicons name={guidedAvoidWater ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={Colors.background} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={guidedIntensity === 'gentle' ? [styles.guidedToggle, styles.guidedToggleSelected] : styles.guidedToggle}
                    onPress={() => setGuidedIntensity((prev) => (prev === 'gentle' ? null : 'gentle'))}
                    activeOpacity={0.9}
                  >
                    <View style={styles.guidedToggleLeft}>
                      <Ionicons name="leaf-outline" size={18} color={Colors.background} />
                      <Text style={styles.guidedToggleText}>Gentle</Text>
                    </View>
                    <Ionicons name={guidedIntensity === 'gentle' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={Colors.background} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={guidedIntensity === 'energizing' ? [styles.guidedToggle, styles.guidedToggleSelected] : styles.guidedToggle}
                    onPress={() => setGuidedIntensity((prev) => (prev === 'energizing' ? null : 'energizing'))}
                    activeOpacity={0.9}
                  >
                    <View style={styles.guidedToggleLeft}>
                      <Ionicons name="flash-outline" size={18} color={Colors.background} />
                      <Text style={styles.guidedToggleText}>Energizing</Text>
                    </View>
                    <Ionicons name={guidedIntensity === 'energizing' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={Colors.background} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroButton}
                    onPress={() => {
                      applyGuidedFiltersAndBrowse();
                    }}
                    disabled={!guidedObjective || !guidedMinutes}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.heroButtonText}>Show matches</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.guidedBackLink} onPress={() => setGuidedStep(2)}>
                    <Ionicons name="arrow-back" size={18} color={Colors.background + 'CC'} />
                    <Text style={styles.guidedBackText}>Back</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>

        </ScrollView>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={2}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.catalogContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={() => {
                    setShowCatalog(false);
                    setIsGuidedResults(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.pageTitle}>{isGuidedResults ? 'Your matches' : 'Explore Exercises'}</Text>

                {isGuidedResults ? (
                  <TouchableOpacity
                    style={styles.searchIconButton}
                    onPress={() => {
                      setShowCatalog(false);
                      setIsGuidedResults(false);
                      setGuidedStep(1);
                    }}
                  >
                    <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.searchIconButton}>
                    <Ionicons name="search" size={22} color={Colors.textPrimary} />
                  </TouchableOpacity>
                )}
              </View>

              {isGuidedResults ? (
                <View style={styles.guidedResultsHeader}>
                  <Text style={styles.guidedResultsCount}>{filteredExercises.length} results</Text>
                  {guidedSummaryLabels.length > 0 ? (
                    <View style={styles.guidedChipsRow}>
                      {guidedSummaryLabels.map((label) => (
                        <View key={label} style={styles.guidedChip}>
                          <Text style={styles.guidedChipText}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryTabsRow}
                  >
                    {CATEGORIES.map((c) => {
                      const isActive = selectedCategory === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.categoryTab}
                          onPress={() => setSelectedCategory(c.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={isActive ? styles.categoryTabTextActive : styles.categoryTabText}>{c.label}</Text>
                          <View style={isActive ? styles.categoryTabUnderlineActive : styles.categoryTabUnderline} />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.filterPillsRow}>
                    <TouchableOpacity
                      style={styles.filterPill}
                      onPress={() =>
                        setSelectedDuration((prev) => (prev === 'short' ? 'all' : 'short'))
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.filterPillText}>Duration</Text>
                      <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.filterPill}
                      onPress={() =>
                        setSelectedLevel((prev) => (prev === 'beginner' ? 'all' : 'beginner'))
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.filterPillText}>Level</Text>
                      <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                      <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search exercises..."
                        placeholderTextColor={Colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                        returnKeyType="search"
                      />
                    </View>
                  </View>

                  <View style={styles.categoryBrowseSection}>
                    <Text style={styles.shelfSectionTitle}>Browse by category</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((c) => {
                        const isActive = selectedCategory === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={isActive ? [styles.categoryTile, styles.categoryTileActive] : styles.categoryTile}
                            onPress={() => setSelectedCategory((prev) => (prev === c.id ? 'all' : c.id))}
                            activeOpacity={0.9}
                          >
                            <View style={[styles.categoryTileIcon, { backgroundColor: `${c.color}22` }]}>
                              <Ionicons name={c.icon} size={22} color={c.color} />
                            </View>
                            <View style={styles.categoryTileInfo}>
                              <Text style={styles.categoryTileTitle}>{c.label}</Text>
                              <Text style={styles.categoryTileCount}>{categoryCounts[c.id]} exercises</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {recentExercises.length > 0 ? (
                    <View style={styles.shelfSection}>
                      <Text style={styles.shelfSectionTitle}>Recently</Text>
                      <FlatList
                        data={recentExercises}
                        keyExtractor={(item) => item.id}
                        renderItem={renderShelfItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.shelfList}
                      />
                    </View>
                  ) : null}

                  {favoriteExercises.length > 0 ? (
                    <View style={styles.shelfSection}>
                      <Text style={styles.shelfSectionTitle}>Favorites</Text>
                      <FlatList
                        data={favoriteExercises}
                        keyExtractor={(item) => item.id}
                        renderItem={renderShelfItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.shelfList}
                      />
                    </View>
                  ) : null}

                  <View style={styles.allHeader}>
                    <Text style={styles.shelfSectionTitle}>All exercises</Text>
                    <Text style={styles.allCount}>{filteredExercises.length}</Text>
                  </View>
                </>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or clear filters.</Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDuration('all');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Simple flow styles
  simpleFlow: {
    flex: 1,
  },
  // Hero card
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#667EEA',
    minHeight: 360,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
  },
  heroContent: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 360,
  },
  heroLabel: {
    fontSize: FontSize.sm,
    color: Colors.background + 'CC',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: FontFamily.heading,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.background + 'CC',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  guidedOptionsGrid: {
    alignSelf: 'stretch',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  guidedOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: Spacing.md,
  },
  guidedOptionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  guidedOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidedOptionText: {
    flex: 1,
  },
  guidedOptionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.background,
  },
  guidedOptionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.background + 'CC',
    marginTop: 2,
  },
  guidedStepBlock: {
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
  },
  guidedStepTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  guidedBackLink: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  guidedBackText: {
    fontSize: FontSize.sm,
    color: Colors.background + 'CC',
    fontWeight: FontWeight.semibold,
  },
  guidedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: Spacing.md,
  },
  guidedToggleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  guidedToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.md,
  },
  guidedToggleText: {
    fontSize: FontSize.md,
    color: Colors.background,
    fontWeight: FontWeight.semibold,
  },
  heroButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: '#667EEA',
    textAlign: 'center',
  },
  timeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  timeButton: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeButtonSelected: {
    backgroundColor: Colors.background,
    borderColor: Colors.background,
  },
  timeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timeButtonSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  // Catalog mode styles
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(30, 58, 52, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(30, 58, 52, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  pageTitle: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  guidedResultsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  guidedResultsCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  guidedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  guidedChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(30, 58, 52, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  guidedChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  categoryTabsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  categoryTab: {
    alignItems: 'center',
  },
  categoryTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  categoryTabTextActive: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  categoryTabUnderline: {
    height: 3,
    width: 64,
    borderRadius: 999,
    marginTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  categoryTabUnderlineActive: {
    height: 3,
    width: 64,
    borderRadius: 999,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 58, 52, 0.9)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  filterPillText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  // Search bar
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  chipsRow: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  shelfSection: {
    paddingTop: Spacing.md,
  },
  shelfSectionTitle: {
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.sm,
  },
  categoryBrowseSection: {
    paddingTop: Spacing.md,
  },
  categoryGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  categoryTileActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  categoryTileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTileInfo: {
    flex: 1,
  },
  categoryTileTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  categoryTileCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  shelfList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  shelfCard: {
    width: 260,
    marginRight: Spacing.md,
  },
  cardThumbnailWrap: {
    height: 84,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardThumbnailWrapGrid: {
    height: 64,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardThumbnail: {
    width: '100%',
    height: '100%',
  },
  shelfTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  shelfTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  shelfSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  catalogContent: {
    paddingBottom: Spacing.xl,
  },
  allHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  allCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  gridItemWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg / 2,
    paddingBottom: Spacing.md,
  },
  gridCard: {
    marginBottom: 0,
    height: 184,
  },
  gridTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gridTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  gridSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  emptyState: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  clearFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  clearFiltersText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  filterButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  // Active filters
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  filterChipText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontStyle: 'italic',
    fontFamily: FontFamily.heading,
  },
  // View toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  toggleButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  // Discovery grid
  discoveryGrid: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.heading,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  traditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  traditionCard: {
    width: 160,
    height: 200,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  traditionCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  traditionCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  traditionCardContent: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traditionName: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  traditionDescription: {
    color: Colors.background + 'CC',
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  traditionCount: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.sm,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  // Category list
  categoryList: {
    padding: Spacing.lg,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  categoryCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  // Section headers (list view)
  sectionHeader: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
    fontFamily: FontFamily.heading,
  },
  sectionHeaderSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  // Exercise list & cards
  exerciseList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
  },
  exerciseTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  originBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originFlag: {
    fontSize: 16,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  favoriteButton: {
    marginLeft: 'auto',
  },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  exerciseDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  // Premium styles
  exerciseCardLocked: {
    opacity: 0.85,
  },
  exerciseNameLocked: {
    color: Colors.textMuted,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  premiumText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
