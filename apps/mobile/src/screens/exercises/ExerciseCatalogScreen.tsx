import { enumLabel } from '../../i18n/labels';
import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, ExerciseIllustration } from '../../components';
import { OriginIcon } from '../../components/OriginIcon';
import { useExercises, useSessions } from '../../hooks';
import { EMPTY_CATALOG_FILTERS, filterCatalog, type CatalogFilters } from '../../utils/catalog-filters';
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
  useLanguage();
  const navigation = useNavigation<any>();
  const { localizedExercises: exercises, isLoading, toggleFavorite } = useExercises();
  const { sessions } = useSessions();
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 390 || fontScale > 1.15 ? 1 : 2;
  const { query: searchQuery, category: selectedCategory, duration: selectedDuration, level: selectedLevel } = filters;
  const setFilter = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) =>
    setFilters((previous) => ({ ...previous, [key]: value }));
  const clearFilters = () => setFilters({ ...EMPTY_CATALOG_FILTERS });
  const hasFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || selectedDuration !== 'all' || selectedLevel !== 'all';

  const renderShelfItem = ({ item }: { item: ExerciseWithFavorite }) => {
    return (
      <Card
        style={{ ...styles.shelfCard, width: Math.min(width - Spacing.lg * 2, 320) }}
        onPress={() => handleExercisePress(item)}
      >
        <View style={styles.cardThumbnailWrap}>
          <ExerciseIllustration exercise={item} variant="card" style={styles.cardThumbnail} />
        </View>
        <View style={styles.shelfTopRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.duration_minutes} {tr("min")}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.is_favorite ? tr("Remove {{name}} from favorites", { name: item.name }) : tr("Add {{name}} to favorites", { name: item.name })} style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
            <Ionicons
              name={item.is_favorite ? 'heart' : 'heart-outline'}
              size={18}
              color={item.is_favorite ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <Text
          style={styles.shelfTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        {item.origin ? (
          <View style={styles.originRow}>
            <OriginIcon origin={item.origin} size={14} color={Colors.textSecondary} />
            <Text style={styles.originText} numberOfLines={2} ellipsizeMode="tail">
              {formatOrigin(item.origin)}
            </Text>
          </View>
        ) : null}
        <Text style={styles.shelfSubtitle} numberOfLines={2} ellipsizeMode="tail">
          {item.description}
        </Text>
      </Card>
    );
  };

  const renderGridItem = ({ item }: { item: ExerciseWithFavorite }) => {
    return (
      <View style={styles.gridItemWrapper}>
        <Card
          style={styles.gridCard}
          onPress={() => handleExercisePress(item)}
        >
          <View style={styles.cardThumbnailWrapGrid}>
            <ExerciseIllustration exercise={item} variant="card" style={styles.cardThumbnail} />
          </View>
          <View style={styles.gridTopRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.duration_minutes} {tr("min")}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.is_favorite ? tr("Remove {{name}} from favorites", { name: item.name }) : tr("Add {{name}} to favorites", { name: item.name })} style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={item.is_favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={item.is_favorite ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={styles.gridTitle}
            numberOfLines={2}
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
          <Text style={styles.gridSubtitle} numberOfLines={columns === 1 ? 3 : 2} ellipsizeMode="tail">
            {item.description}
          </Text>
        </Card>
      </View>
    );
  };

  const filteredExercises = useMemo(() => filterCatalog(exercises, filters), [exercises, filters]);

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

  const handleExercisePress = (exercise: ExerciseWithFavorite) => {
    navigation.navigate('ExerciseDetail', {
      exerciseId: exercise.id,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.catalogContent}>
          <View style={styles.topBar}>
            <Text style={styles.pageTitle}>{tr("Explore Exercises")}</Text>
          </View>
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.skeletonTile} />
            ))}
          </View>
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
        key={`catalog-${columns}`}
        numColumns={columns}
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
              <Text style={styles.pageTitle}>{tr("Explore Exercises")}</Text>
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
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setFilter('category', c.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={isActive ? styles.categoryTabTextActive : styles.categoryTabText}>{tr(c.label)}</Text>
                    <View style={isActive ? styles.categoryTabUnderlineActive : styles.categoryTabUnderline} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.filterPillsRow}>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: filtersOpen }}
                style={styles.filterPill} onPress={() => setFiltersOpen(!filtersOpen)}>
                <Text style={styles.filterPillText}>{tr("Filters")}</Text>
                <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              {hasFilters && <TouchableOpacity accessibilityRole="button" onPress={clearFilters} style={styles.filterPill}>
                <Text style={styles.filterPillText}>{tr("Clear all")}</Text>
              </TouchableOpacity>}
            </View>
            {!filtersOpen && (selectedDuration !== 'all' || selectedLevel !== 'all') &&
              <Text style={styles.filterSummary}>{tr(DURATION_LABELS[selectedDuration])} · {formatLevel(selectedLevel)}</Text>}
            {filtersOpen && <View style={styles.filterOptions}>
              <Text style={styles.filterLabel}>{tr("Duration")}</Text>
              <View style={styles.optionRow}>
                {(Object.keys(DURATION_LABELS) as CatalogFilters['duration'][]).map((duration) => (
                  <TouchableOpacity key={duration} accessibilityRole="radio" accessibilityState={{ checked: selectedDuration === duration }}
                    onPress={() => setFilter('duration', duration)} style={[styles.filterPill, selectedDuration === duration && styles.filterPillActive]}>
                    <Text style={styles.filterPillText}>{tr(DURATION_LABELS[duration])}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.filterLabel}>{tr("Level")}</Text>
              <View style={styles.optionRow}>
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <TouchableOpacity key={level} accessibilityRole="radio" accessibilityState={{ checked: selectedLevel === level }}
                    onPress={() => setFilter('level', level)} style={[styles.filterPill, selectedLevel === level && styles.filterPillActive]}>
                    <Text style={styles.filterPillText}>{formatLevel(level)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>}

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={tr("Search exercises...")}
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={(query) => setFilter('query', query)}
                  accessibilityLabel={tr("Search exercises")}
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
              </View>
            </View>

            {!hasFilters && recentExercises.length > 0 ? (
              <View style={styles.shelfSection}>
                <Text style={styles.shelfSectionTitle}>{tr("Recently")}</Text>
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

            {!hasFilters && favoriteExercises.length > 0 ? (
              <View style={styles.shelfSection}>
                <Text style={styles.shelfSectionTitle}>{tr("Favorites")}</Text>
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
              <Text style={styles.shelfSectionTitle}>{hasFilters ? tr("Matching exercises") : tr("All exercises")}</Text>
              <Text style={styles.allCount}>{filteredExercises.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{tr("No exercises found")}</Text>
            <Text style={styles.emptySubtitle}>{tr("Try a different search or clear filters.")}</Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              accessibilityRole="button"
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>{tr("Clear filters")}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const formatOrigin = (origin: string): string => {
  return enumLabel(origin);
};

const DURATION_LABELS: Record<CatalogFilters['duration'], string> = {
  all: 'Any length',
  short: '3 min or less',
  medium: '4 to 7 min',
  long: '8+ min',
};

const formatLevel = (level: string): string => (level === 'all' ? tr("Any level") : enumLabel(level));

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
    minHeight: 44,
    justifyContent: 'center',
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
  filterSummary: { color: Colors.textSecondary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  filterOptions: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  filterLabel: { color: Colors.textPrimary, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterPillsRow: {
    flexWrap: 'wrap',
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
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  skeletonTile: {
    width: '48%',
    height: 184,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    marginBottom: Spacing.md,
  },
  filterPillActive: {
    backgroundColor: Colors.primary + '1F',
    borderColor: Colors.primary,
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
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
    flexWrap: 'wrap',
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
    // Floor for visual consistency, but grow with content. A fixed height
    // clipped the card background while the (overflow-visible) text rendered
    // below it, so long names + the origin row spilled outside the card.
    minHeight: 184,
  },
  gridTopRow: {
    flexWrap: 'wrap',
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
    flexShrink: 1,
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
