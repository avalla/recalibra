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
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, ExerciseIllustration } from '../../components';
import { OriginIcon } from '../../components/OriginIcon';
import { useExercises, useSessions, useSubscription } from '../../hooks';
import type { ExerciseWithFavorite, ExerciseCategory } from '../../types';

const CATEGORIES: { id: ExerciseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: 'leaf-outline', color: '#4ECDC4' },
  { id: 'water', label: 'Water', icon: 'water-outline', color: '#45B7D1' },
  { id: 'movement', label: 'Movement', icon: 'body-outline', color: '#96CEB4' },
  { id: 'sensory', label: 'Sensory', icon: 'ear-outline', color: '#DDA0DD' },
];

const CATEGORY_TABS: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  ...CATEGORIES.map((category) => ({ id: category.id, label: category.label })),
];

export const ExerciseCatalogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { exercises, isLoading, toggleFavorite } = useExercises();
  const { sessions } = useSessions();
  const { canAccessExercise, presentPaywall } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedDuration, setSelectedDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const renderShelfItem = ({ item }: { item: ExerciseWithFavorite }) => {
    const isLocked = !canAccessExercise(item.slug, item.is_premium);

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
        <Text
          style={[styles.shelfTitle, isLocked && styles.exerciseNameLocked]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        {item.origin ? (
          <View style={styles.originRow}>
            <OriginIcon origin={item.origin} size={14} color={Colors.textSecondary} />
            <Text style={styles.originText}>{formatOrigin(item.origin)}</Text>
          </View>
        ) : null}
        <Text style={styles.shelfSubtitle} numberOfLines={1} ellipsizeMode="tail">
          {item.description}
        </Text>
      </Card>
    );
  };

  const renderGridItem = ({ item }: { item: ExerciseWithFavorite }) => {
    const isLocked = !canAccessExercise(item.slug, item.is_premium);

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
          <Text
            style={[styles.gridTitle, isLocked && styles.exerciseNameLocked]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          {item.origin ? (
            <View style={styles.originRow}>
              <OriginIcon origin={item.origin} size={14} color={Colors.textSecondary} />
              <Text style={styles.originText}>{formatOrigin(item.origin)}</Text>
            </View>
          ) : null}
          <Text style={styles.gridSubtitle} numberOfLines={1} ellipsizeMode="tail">
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
    if (!canAccessExercise(exercise.slug, exercise.is_premium)) {
      const didPurchase = await presentPaywall();
      if (!didPurchase) navigation.navigate('Paywall');
      return;
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
              {CATEGORY_TABS.map((c) => {
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
                onPress={() => setSelectedDuration((prev) => (prev === 'short' ? 'all' : 'short'))}
                activeOpacity={0.85}
              >
                <Text style={styles.filterPillText}>Duration</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => setSelectedLevel((prev) => (prev === 'beginner' ? 'all' : 'beginner'))}
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
    </SafeAreaView>
  );
};

const formatOrigin = (origin: string): string => {
  return origin
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
    fontFamily: FontFamily.heading,
    marginTop: Spacing.sm,
    flexShrink: 1,
  },
  shelfSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 2,
    flexShrink: 1,
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
    fontFamily: FontFamily.heading,
    marginTop: Spacing.sm,
    flexShrink: 1,
  },
  gridSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 2,
    flexShrink: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  originText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
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
