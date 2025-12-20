import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SectionList,
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
import { OriginIcon } from '../../components/OriginIcon';
import { MoodSelector } from '../../components/MoodSelector';
import { useExercises, useSubscription } from '../../hooks';
import { getExerciseBackground } from '../../constants/backgrounds';
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
  const [showCatalog, setShowCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle mood selection - find best exercise for this mood
  const handleMoodSelect = (mood: any) => {
    const moodExercises = exercises.filter(e => e && e.category === mood.exerciseCategory);
    if (moodExercises.length === 0) {
      // No exercises found for this mood, show feedback
      console.warn('No exercises found for mood:', mood.id);
      return;
    }
    
    // Pick the first matching exercise (could be improved with recommendation logic)
    const exercise = moodExercises[0];
    if (!exercise) {
      console.warn('First exercise is undefined');
      return;
    }
    
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

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises;
    
    return exercises.filter(e => 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exercises, searchQuery]);

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
        title: tradition.name,
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

  // Render exercise card
  const renderExerciseCard = (item: ExerciseWithFavorite) => {
    const tradition = getTradition(item.origin);
    const isLocked = !canAccessExercise(item.name, item.is_premium);
    
    return (
      <Card style={isLocked ? { ...styles.exerciseCard, ...styles.exerciseCardLocked } : styles.exerciseCard} onPress={() => handleExercisePress(item)}>
        <View style={styles.exerciseTags}>
          <View style={styles.originBadge}>
            <OriginIcon origin={tradition.id} size={16} />
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
        <Text style={styles.exerciseDescription} numberOfLines={3}>{item.description}</Text>
      </Card>
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
              <Text style={styles.heroLabel}>Today's Exercise</Text>
              <Text style={styles.heroTitle}>
                {exercises.length > 0 && exercises[0] ? exercises[0].name : 'Loading...'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {exercises.length > 0 && exercises[0] ? exercises[0].description : 'Preparing your daily practice...'}
              </Text>
              
              {exercises.length > 0 && exercises[0] ? (
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => handleExercisePress(exercises[0])}
                >
                  <Text style={styles.heroButtonText}>Start Now</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.heroButton}>
                  <ActivityIndicator size="small" color={Colors.background} />
                </View>
              )}
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
        // Full catalog (previous implementation)
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowCatalog(false)}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            <Text style={styles.backText}>Back to Quick Start</Text>
          </TouchableOpacity>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* Exercise list */}
          <ScrollView contentContainerStyle={styles.exerciseList}>
            {filteredExercises.map(renderExerciseCard)}
          </ScrollView>
        </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
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
