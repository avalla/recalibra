import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Button, Card } from '../../components';
import { useSessions, useAppleHealth } from '../../hooks';
import type { JourneyProgress, RootStackParamList } from '../../types';
import { logger } from '../../utils/logger';
import { journeyDefinitions } from '../../data/journeys';
import { getNextJourneyChapter } from '../../features/journeys/state';

const STRESS_EMOJIS = ['😇', '🙂', '😌', '😟', '😰'];

type PostSessionRouteProps = RouteProp<RootStackParamList, 'PostSession'>;

export const PostSessionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PostSessionRouteProps>();
  const {
    sessionId,
    exerciseName,
    durationSeconds,
    preStressLevel,
    journeyId,
    journeyChapterIndex,
  } = route.params;
  const { completeSession, completeSessionAndJourney } = useSessions();
  const { isAvailable: healthAvailable, isAuthorized: healthAuthorized, saveMindfulSession } = useAppleHealth();

  const [postStressLevel, setPostStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [healthSaved, setHealthSaved] = useState<boolean | null>(null);
  const saveInFlightRef = useRef(false);

  const stressReduction = preStressLevel - postStressLevel;
  const durationLabel = `${Math.max(1, Math.round(durationSeconds / 60))} min`;

  const handleSave = async () => {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setIsSaving(true);

    try {
      let journeyProgress: JourneyProgress | null = null;
      let error: Error | null = null;

      if (journeyId && typeof journeyChapterIndex === 'number') {
        const result = await completeSessionAndJourney(
          sessionId,
          durationSeconds,
          postStressLevel,
          notes || undefined,
          journeyId,
          journeyChapterIndex
        );
        journeyProgress = result.progress;
        error = result.error;
      } else {
        ({ error } = await completeSession(sessionId, durationSeconds, postStressLevel, notes || undefined));
      }

      if (error) throw error;

      if (healthAvailable && healthAuthorized) {
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - durationSeconds * 1000);
          const saved = await saveMindfulSession(startDate, endDate);
          setHealthSaved(saved);
          if (saved) logger.info('Mindful session saved to Apple Health', 'PostSession');
        } catch (healthError) {
          logger.error('Mindful session could not be saved to Apple Health', healthError as Error, 'PostSession');
          setHealthSaved(false);
        }
      }

      if (journeyId && typeof journeyChapterIndex === 'number') {
        const journey = journeyDefinitions.find((item) => item.id === journeyId);
        if (!journey || !journeyProgress) throw new Error('Journey progress is unavailable');

        const nextChapter = getNextJourneyChapter(journeyProgress, journey.chapters.length);
        if (nextChapter === null) {
          navigation.replace('JourneyDetail', { journeyId });
        } else {
          navigation.replace('JourneyRunner', {
            journeyId,
            chapterIndex: nextChapter,
            justCompleted: true,
          });
        }
        return;
      }

      navigation.navigate('ExerciseCatalog');
    } catch (error) {
      logger.error('Session completion failed', error as Error, 'PostSession');
      Alert.alert('Error', 'Failed to save session. Please try again.');
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (journeyId && typeof journeyChapterIndex === 'number') {
      navigation.replace('JourneyRunner', { journeyId, chapterIndex: journeyChapterIndex });
      return;
    }
    navigation.navigate('ExerciseCatalog');
  };

  const getEmojiForLevel = (level: number): string => {
    if (level <= 2) return '😇';
    if (level <= 4) return '🙂';
    if (level <= 6) return '😌';
    if (level <= 8) return '😟';
    return '😰';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reflect</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Closing reassurance */}
        <View style={styles.celebrate}>
          <Text style={styles.celebrateEyebrow}>Nicely done</Text>
          <Text style={styles.celebrateTitle}>{exerciseName}</Text>
          <Text style={styles.celebrateMeta}>{durationLabel} of practice</Text>
        </View>

        {/* Main Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>How do you feel now?</Text>
        </View>

        {/* Emoji Scale */}
        <View style={styles.emojiRow}>
          {STRESS_EMOJIS.map((emoji, index) => {
            const level = (index + 1) * 2;
            const isSelected = Math.ceil(postStressLevel / 2) === index + 1;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.emojiButton, isSelected && styles.emojiButtonSelected]}
                onPress={() => setPostStressLevel(level)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { width: `${((postStressLevel - 1) / 9) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${((postStressLevel - 1) / 9) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>High</Text>
            <Text style={styles.sliderLabel}>Low</Text>
          </View>
        </View>

        {/* Stress Reduction Card */}
        {stressReduction > 0 && (
          <Card style={styles.reductionCard}>
            <View style={styles.reductionContent}>
              <View>
                <Text style={styles.reductionValue}>-{stressReduction} points</Text>
                <Text style={styles.reductionText}>
                  Your stress level has decreased since the start of your session.
                </Text>
              </View>
              <View style={styles.reductionIcon}>
                <Ionicons name="trending-down" size={24} color={Colors.primary} />
              </View>
            </View>
          </Card>
        )}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>What did you notice?</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any observations during your session..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button label="Done" onPress={handleSave} loading={isSaving} />
        <TouchableOpacity style={styles.progressLink} onPress={handleSkip}>
          <Text style={styles.progressLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  headerSpacer: {
    width: 28,
  },
  celebrate: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  celebrateEyebrow: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  celebrateTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.heading,
  },
  celebrateMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  questionSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  questionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  questionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
  },
  emojiButtonSelected: {
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  emoji: {
    fontSize: 24,
  },
  sliderContainer: {
    marginBottom: Spacing.xl,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sliderLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  reductionCard: {
    backgroundColor: Colors.backgroundElevated,
    marginBottom: Spacing.xl,
  },
  reductionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reductionValue: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  reductionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    maxWidth: '80%',
  },
  reductionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  progressLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  progressLinkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
