import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card } from '../../components';
import { useExercises, useSubscription } from '../../hooks';
import type { ExerciseWithFavorite, ExerciseCategory, ExerciseOrigin } from '../../types';

// View modes
type ViewMode = 'tradition' | 'category' | 'list';

// Traditions with flags and info (ordered by antiquity/region)
const TRADITIONS: { id: ExerciseOrigin; flag: string; name: string; description: string }[] = [
  // Ancient Asian
  { id: 'india', flag: '🇮🇳', name: 'India', description: 'Pranayama ~3000 BCE' },
  { id: 'china', flag: '🇨🇳', name: 'China', description: 'Qigong ~600 BCE' },
  { id: 'tibet', flag: '🏔️', name: 'Tibet', description: 'Buddhist ~700 CE' },
  { id: 'japan', flag: '🇯🇵', name: 'Japan', description: 'Zen ~1200 CE' },
  { id: 'korea', flag: '🇰🇷', name: 'Korea', description: 'Sundo ancient' },
  { id: 'thailand', flag: '🇹🇭', name: 'Thailand', description: 'Ruesri Dat Ton' },
  { id: 'mongolia', flag: '🇲🇳', name: 'Mongolia', description: 'Khoomei ancient' },
  { id: 'indonesia', flag: '🇮🇩', name: 'Indonesia', description: 'Tenaga Dalam' },
  // Middle East & Persia
  { id: 'sufi', flag: '☪️', name: 'Sufi', description: 'Heart ~800 CE' },
  { id: 'persia', flag: '🕌', name: 'Persia', description: 'Zikr & Whirling' },
  // Pacific & Oceania
  { id: 'hawaii', flag: '🌺', name: 'Hawaii', description: 'Ha breath ancient' },
  { id: 'australia', flag: '🇦🇺', name: 'Australia', description: 'Aboriginal 40,000 yrs' },
  // Africa
  { id: 'africa', flag: '🌍', name: 'Africa', description: 'Ubuntu & Yoruba' },
  // Americas
  { id: 'native_america', flag: '🦅', name: 'Native American', description: 'Medicine Wheel' },
  { id: 'mexico', flag: '🇲🇽', name: 'Mexico', description: 'Aztec/Maya' },
  { id: 'brazil', flag: '🇧🇷', name: 'Brazil', description: 'Capoeira & Holotropic' },
  // Europe
  { id: 'russia', flag: '🇷🇺', name: 'Russia', description: 'Systema Spetsnaz' },
  { id: 'scandinavia', flag: '🇸🇪', name: 'Scandinavia', description: 'Viking & Hygge' },
  { id: 'greece', flag: '🇬🇷', name: 'Greece', description: 'Ancient Pneuma' },
  { id: 'netherlands', flag: '🇳🇱', name: 'Netherlands', description: 'Wim Hof Method' },
  // Modern & Universal
  { id: 'usa', flag: '🇺🇸', name: 'Modern', description: 'Science 20th c.' },
  { id: 'universal', flag: '🌐', name: 'Universal', description: 'Timeless' },
];

const CATEGORIES: { id: ExerciseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'breathing', label: 'Breathing', icon: 'leaf-outline', color: '#4ECDC4' },
  { id: 'water', label: 'Water', icon: 'water-outline', color: '#45B7D1' },
  { id: 'movement', label: 'Movement', icon: 'body-outline', color: '#96CEB4' },
  { id: 'sensory', label: 'Sensory', icon: 'ear-outline', color: '#DDA0DD' },
];

export const ExerciseCatalogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { exercises, isLoading, toggleFavorite } = useExercises();
  const { isPremium, canAccessExercise, presentPaywall } = useSubscription();
  const [viewMode, setViewMode] = useState<ViewMode>('tradition');
  const [selectedTradition, setSelectedTradition] = useState<ExerciseOrigin | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);

  // Get tradition info
  const getTradition = (origin?: ExerciseOrigin) => {
    return TRADITIONS.find(t => t.id === origin) || TRADITIONS[TRADITIONS.length - 1];
  };

  // Get category info
  const getCategory = (category: ExerciseCategory) => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return Colors.primary;
      case 'intermediate': return Colors.warning;
      case 'advanced': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  // Filter exercises based on selection
  const filteredExercises = useMemo(() => {
    if (selectedTradition) {
      return exercises.filter(e => (e.origin || 'universal') === selectedTradition);
    }
    if (selectedCategory) {
      return exercises.filter(e => e.category === selectedCategory);
    }
    return exercises;
  }, [exercises, selectedTradition, selectedCategory]);

  // Group exercises by tradition for section list
  const sectionsByTradition = useMemo(() => {
    const groups: { [key: string]: ExerciseWithFavorite[] } = {};
    exercises.forEach(exercise => {
      const origin = exercise.origin || 'universal';
      if (!groups[origin]) groups[origin] = [];
      groups[origin].push(exercise);
    });
    
    return TRADITIONS
      .filter(t => groups[t.id]?.length > 0)
      .map(tradition => ({
        title: `${tradition.flag} ${tradition.name}`,
        subtitle: tradition.description,
        data: groups[tradition.id] || [],
      }));
  }, [exercises]);

  // Group exercises by category
  const sectionsByCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      title: cat.label,
      icon: cat.icon,
      color: cat.color,
      data: exercises.filter(e => e.category === cat.id),
    })).filter(section => section.data.length > 0);
  }, [exercises]);

  const handleExercisePress = async (exercise: ExerciseWithFavorite) => {
    // Check if user can access this exercise
    if (!canAccessExercise(exercise.name, exercise.is_premium)) {
      // Show RevenueCat paywall
      const purchased = await presentPaywall();
      if (!purchased) return;
    }
    
    navigation.navigate('ExerciseSession', {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationMinutes: exercise.duration_minutes,
      audioPreset: exercise.audio_preset || 'silence',
      exerciseCategory: exercise.category,
      breathingPattern: exercise.breathing_pattern,
      origin: exercise.origin,
      history: exercise.history,
      benefits: exercise.benefits,
      tips: exercise.tips,
      instructions: exercise.instructions,
    });
  };

  const handleBack = () => {
    setSelectedTradition(null);
    setSelectedCategory(null);
  };

  // Render exercise card
  const renderExerciseCard = ({ item }: { item: ExerciseWithFavorite }) => {
    const tradition = getTradition(item.origin);
    const isLocked = !canAccessExercise(item.name, item.is_premium);
    
    return (
      <Card style={isLocked ? { ...styles.exerciseCard, ...styles.exerciseCardLocked } : styles.exerciseCard} onPress={() => handleExercisePress(item)}>
        <View style={styles.exerciseTags}>
          <View style={styles.originBadge}>
            <Text style={styles.originFlag}>{tradition.flag}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.duration_minutes} min</Text>
          </View>
          <View style={[styles.tag, { borderColor: getLevelColor(item.level) }]}>
            <Text style={[styles.tagText, { color: getLevelColor(item.level) }]}>
              {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
            </Text>
          </View>
          {isLocked ? (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.warning} />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Ionicons
                name={item.is_favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={item.is_favorite ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.exerciseName, isLocked && styles.exerciseNameLocked]}>{item.name}</Text>
        <Text style={styles.exerciseDescription} numberOfLines={2}>{item.description}</Text>
      </Card>
    );
  };

  // Render tradition card for discovery
  const renderTraditionCard = (tradition: typeof TRADITIONS[0]) => {
    // Handle exercises without origin - count them as 'universal'
    const count = exercises.filter(e => {
      const origin = e.origin || 'universal';
      return origin === tradition.id;
    }).length;
    if (count === 0) return null;
    
    return (
      <TouchableOpacity
        key={tradition.id}
        style={styles.traditionCard}
        onPress={() => setSelectedTradition(tradition.id)}
      >
        <Text style={styles.traditionFlag}>{tradition.flag}</Text>
        <Text style={styles.traditionName}>{tradition.name}</Text>
        <Text style={styles.traditionDescription}>{tradition.description}</Text>
        <Text style={styles.traditionCount}>{count} exercises</Text>
      </TouchableOpacity>
    );
  };

  // Render category card
  const renderCategoryCard = (category: typeof CATEGORIES[0]) => {
    const count = exercises.filter(e => e.category === category.id).length;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryCard, { borderLeftColor: category.color }]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon} size={24} color={category.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{category.label}</Text>
          <Text style={styles.categoryCount}>{count} exercises</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
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

  // Show filtered list when tradition or category is selected
  if (selectedTradition || selectedCategory) {
    const title = selectedTradition 
      ? `${getTradition(selectedTradition).flag} ${getTradition(selectedTradition).name}`
      : getCategory(selectedCategory!).label;
      
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <SectionList
          sections={[{ title: '', data: filteredExercises }]}
          renderItem={renderExerciseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={() => null}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'tradition' && styles.toggleButtonActive]}
            onPress={() => setViewMode('tradition')}
          >
            <Ionicons name="flag-outline" size={18} color={viewMode === 'tradition' ? Colors.background : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'category' && styles.toggleButtonActive]}
            onPress={() => setViewMode('category')}
          >
            <Ionicons name="grid-outline" size={18} color={viewMode === 'category' ? Colors.background : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? Colors.background : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'tradition' && (
        <ScrollView 
          contentContainerStyle={styles.discoveryGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Explore by Tradition</Text>
          <Text style={styles.sectionSubtitle}>
            Discover breathing practices from ancient cultures around the world
          </Text>
          <View style={styles.traditionsGrid}>
            {TRADITIONS.map(renderTraditionCard)}
          </View>
        </ScrollView>
      )}

      {viewMode === 'category' && (
        <ScrollView 
          contentContainerStyle={styles.categoryList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Browse by Type</Text>
          {CATEGORIES.map(renderCategoryCard)}
        </ScrollView>
      )}

      {viewMode === 'list' && (
        <SectionList
          sections={sectionsByTradition}
          renderItem={renderExerciseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              <Text style={styles.sectionHeaderSubtitle}>{section.subtitle}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={false}
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
  },
  backButton: {
    padding: Spacing.xs,
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
    width: '47%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  traditionFlag: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  traditionName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  traditionDescription: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  traditionCount: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
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
