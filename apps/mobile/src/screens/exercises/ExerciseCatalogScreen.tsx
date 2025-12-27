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
import { Card } from '../../components';
import { useExercises, useSessions, useSubscription } from '../../hooks';
import type { ExerciseWithFavorite, ExerciseCategory } from '../../types';

const CATEGORIES: { id: ExerciseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: 'leaf-outline', color: '#4ECDC4' },
  { id: 'water', label: 'Water', icon: 'water-outline', color: '#45B7D1' },
  { id: 'movement', label: 'Movement', icon: 'body-outline', color: '#96CEB4' },
  { id: 'sensory', label: 'Sensory', icon: 'ear-outline', color: '#DDA0DD' },
];

export const ExerciseCatalogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { exercises, isLoading, toggleFavorite } = useExercises();
  const { sessions } = useSessions();
  const { canAccessExercise, presentPaywall } = useSubscription();
  const [showCatalog, setShowCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const renderShelfItem = ({ item }: { item: ExerciseWithFavorite }) => {
    const isLocked = !canAccessExercise(item.name, item.is_premium);

    return (
      <Card
        style={isLocked ? { ...styles.shelfCard, ...styles.exerciseCardLocked } : styles.shelfCard}
        onPress={() => handleExercisePress(item)}
      >
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

  // Handle time-based selection
  const handleTimeSelect = (minutes: number) => {
    // Find exercises matching the time preference
    const timeExercises = exercises.filter(e => 
      e && e.duration_minutes <= minutes
    );
    
    if (timeExercises.length === 0) {
      console.warn('No exercises found for time:', minutes);
      return;
    }
    
    // Pick the longest exercise that fits the time
    const exercise = timeExercises.reduce((longest, current) => 
      current.duration_minutes > longest.duration_minutes ? current : longest
    );
    
    navigation.navigate('ExerciseSession', {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationMinutes: exercise.duration_minutes,
      audioPreset: exercise.audio_preset,
      exerciseCategory: exercise.category,
      breathingPattern: exercise.breathing_pattern,
      origin: exercise.origin || 'universal',
      history: exercise.history || '',
      benefits: exercise.benefits || '',
      tips: exercise.tips || '',
      instructions: exercise.instructions || '',
    });
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

      if (selectedLevel !== 'all' && e.level !== selectedLevel) return false;

      if (selectedDuration !== 'all') {
        const minutes = e.duration_minutes;
        if (selectedDuration === 'short' && minutes > 3) return false;
        if (selectedDuration === 'medium' && (minutes < 4 || minutes > 7)) return false;
        if (selectedDuration === 'long' && minutes < 8) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedCategory, selectedDuration, selectedLevel]);

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
        // Premium minimal flow
        <ScrollView style={styles.simpleFlow} showsVerticalScrollIndicator={false}>
          {/* Hero Card - Today's Exercise */}
          <View style={styles.heroCard}>
            {/* @ts-ignore - LinearGradient type issue with React 19 */}
            <LinearGradient
              colors={['#667EEA', '#764BA2'] as any}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              {(() => {
                const firstExercise = exercises[0];
                return (
                  <>
              <Text style={styles.heroLabel}>Today's Exercise</Text>
              <Text style={styles.heroTitle}>
                    {firstExercise ? firstExercise.name : 'Loading...'}
              </Text>
              <Text style={styles.heroSubtitle}>
                    {firstExercise ? firstExercise.description : 'Preparing your daily practice...'}
              </Text>
              
                    {firstExercise ? (
                <TouchableOpacity
                  style={styles.heroButton}
                        onPress={() => handleExercisePress(firstExercise)}
                >
                  <Text style={styles.heroButtonText}>Start Now</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.heroButton}>
                  <ActivityIndicator size="small" color={Colors.background} />
                </View>
              )}
                  </>
                );
              })()}
            </View>
          </View>

          {/* Quick Time Options */}
          <View style={styles.timeSection}>
            <Text style={styles.timeTitle}>How much time do you have?</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleTimeSelect(3)}
              >
                <Text style={styles.timeButtonText}>3 min</Text>
                <Text style={styles.timeButtonSubtext}>Quick</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.timeButton, styles.timeButtonPrimary]}
                onPress={() => handleTimeSelect(5)}
              >
                <Text style={[styles.timeButtonText, styles.timeButtonTextPrimary]}>5 min</Text>
                <Text style={[styles.timeButtonSubtext, styles.timeButtonSubtextPrimary]}>Standard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => handleTimeSelect(10)}
              >
                <Text style={styles.timeButtonText}>10 min</Text>
                <Text style={styles.timeButtonSubtext}>Deep</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Browse all link */}
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setShowCatalog(true)}
          >
            <Text style={styles.browseText}>Browse All Exercises</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
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
                <TouchableOpacity style={styles.backIconButton} onPress={() => setShowCatalog(false)}>
                  <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Explore Exercises</Text>
                <TouchableOpacity style={styles.searchIconButton}>
                  <Ionicons name="search" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

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
    minHeight: 360,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  // Time selection
  timeSection: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  timeTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
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
  timeButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timeButtonTextPrimary: {
    color: Colors.background,
  },
  timeButtonSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  timeButtonSubtextPrimary: {
    color: Colors.background + 'CC',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  browseText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
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
    height: 164,
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
