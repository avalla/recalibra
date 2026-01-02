import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';

import { Card, ExerciseIllustration, Screen } from '@/components';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants';
import { useExercises } from '@/hooks';
import type { RootStackParamList } from '@/types';
import type { RouteProp } from '@react-navigation/native';

type DetailRouteProps = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRouteProps>();
  const insets = useSafeAreaInsets();
  const { exercises, isLoading, toggleFavorite } = useExercises();

  const exercise = useMemo(() => {
    return exercises.find((e) => e.id === route.params.exerciseId) ?? null;
  }, [exercises, route.params.exerciseId]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleFavorite = () => {
    if (!exercise) return;
    toggleFavorite(exercise.id);
  };

  const handleStartSession = () => {
    if (!exercise) return;

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

  if (isLoading || !exercise) {
    return (
      <Screen style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  const primaryMedia = exercise.media?.[0];
  const videoSource = primaryMedia?.type === 'video' ? primaryMedia.uri : null;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
  });

  const tags = [
    exercise.origin ? formatOrigin(exercise.origin) : null,
    `${exercise.duration_minutes} Minutes`,
    formatLevel(exercise.level),
  ].filter(Boolean) as string[];

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroImageWrap}>
            {primaryMedia?.type === 'video' && videoSource ? (
              <VideoView
                style={styles.heroVideo}
                player={player}
                nativeControls
                allowsFullscreen
                allowsPictureInPicture
              />
            ) : primaryMedia?.type === 'image' && primaryMedia.uri ? (
              <Image source={{ uri: primaryMedia.uri }} style={styles.heroImage} />
            ) : exercise.image_url ? (
              <Image source={{ uri: exercise.image_url }} style={styles.heroImage} />
            ) : (
              <ExerciseIllustration
                exercise={exercise}
                variant="hero"
                animated
                style={styles.heroIllustration}
              />
            )}
          </View>
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{exercise.name}</Text>

          <View style={styles.tagsRow}>
            {tags.map((t) => (
              <View key={t} style={styles.tagPill}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          {exercise.history ? (
            <Card variant="soft" style={styles.howItWorksCard}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>How it Works</Text>
              </View>
              <Text style={styles.cardBody}>{exercise.history}</Text>
            </Card>
          ) : null}
        </View>

        {exercise.safety_warning ? (
          <Card style={styles.safetyCard}>
            <View style={styles.safetyTitleRow}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
              <Text style={styles.safetyTitle}>Safety First</Text>
            </View>
            <Text style={styles.safetyText}>{exercise.safety_warning}</Text>
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            {exercise.instructions.map((step) => (
              <View key={step.step} style={styles.instructionRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.step}</Text>
                </View>
                <Text style={styles.instructionText}>{step.instruction}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Spacing.md + insets.bottom,
          },
        ]}
      >
        <TouchableOpacity style={styles.primaryCta} onPress={handleStartSession} activeOpacity={0.9}>
          <Text style={styles.primaryCtaText}>Start Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteCta} activeOpacity={0.85} onPress={handleToggleFavorite}>
          <Ionicons name={exercise.is_favorite ? 'heart' : 'heart-outline'} size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

function formatLevel(level: string): string {
  if (level === 'beginner') return 'Beginner';
  if (level === 'intermediate') return 'Intermediate';
  if (level === 'advanced') return 'Advanced';
  return level;
}

function formatOrigin(origin: string): string {
  return origin
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  heroImageWrap: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    height: 140,
    backgroundColor: Colors.backgroundCard,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroVideo: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
  },
  headerRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(30, 58, 52, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  titleSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
    lineHeight: 34,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  tagPill: {
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.18)',
  },
  tagText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  howItWorksCard: {
    marginTop: Spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(45, 212, 191, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  instructionText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  safetyCard: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  safetyTitle: {
    color: Colors.warning,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  safetyText: {
    color: 'rgba(255, 214, 102, 0.92)',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(15, 26, 25, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.12)',
  },
  primaryCta: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  favoriteCta: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
