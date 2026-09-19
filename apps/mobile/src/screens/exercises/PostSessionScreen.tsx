import { formatMinutes } from '../../i18n/core';
import { tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { localizedExerciseName } from '../../i18n/exercises';
import React, { useRef, useState } from 'react';
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
import { Button } from '../../components';
import { useSessions, useAppleHealth } from '../../hooks';
import { useExercises } from '../../hooks';
import type { RootStackParamList } from '../../types';
import { logger } from '../../utils/logger';
import { getJourneyById } from '../../data/journeys';
import { completeJourneyStep } from '../../db';
import { toNextJourneySessionParams } from '../../utils/journey-runner';

import { StressRating } from '../../components/StressRating';
import { describeStressChange } from '../../utils/stress-rating';

type PostSessionRouteProps = RouteProp<RootStackParamList, 'PostSession'>;

export const PostSessionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PostSessionRouteProps>();
  const { language } = useLanguage();
  const { sessionId, exerciseId, exerciseName: canonicalName, durationSeconds, preStressLevel, journeyContext } = route.params;
  const exerciseName = localizedExerciseName(exerciseId ?? '', canonicalName, language);
  const { completeSession } = useSessions();
  const { exercises, isLoading: exercisesLoading } = useExercises();
  const { isAvailable: healthAvailable, isAuthorized: healthAuthorized, saveMindfulSession } = useAppleHealth();

  const [postStressLevel, setPostStressLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const feedback = describeStressChange(preStressLevel, postStressLevel);
  const durationLabel = formatMinutes(Math.max(1, Math.round(durationSeconds / 60)));

  const handleSave = async (rating: number | null) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    let sessionSaved = false;
    try {
      const { error } = await completeSession(sessionId, durationSeconds, rating, notes || undefined);
      if (error) throw error;
      sessionSaved = true;

      if (healthAvailable && healthAuthorized) {
        // Health is optional: a failure must not undo the local session save.
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - durationSeconds * 1000);
          await saveMindfulSession(startDate, endDate);
        } catch {
          logger.warn('Optional Health save failed', 'PostSession');
        }
      }

      if (journeyContext) {
        const journey = getJourneyById(journeyContext.journeyId);
        if (!journey || journey.version !== journeyContext.journeyVersion) {
          throw new Error('Journey content is unavailable or has changed.');
        }
        const progress = await completeJourneyStep({
          journey,
          stepId: journeyContext.stepId,
          sessionId,
        });
        const nextSession = toNextJourneySessionParams(journey, progress, exercises);
        if (nextSession) {
          navigation.replace('ExerciseSession', nextSession);
          return;
        }
        if (exercisesLoading) {
          throw new Error('Exercise catalog is still loading.');
        }
        if (progress.status === 'in_progress') {
          throw new Error('The next Journey exercise is unavailable.');
        }
      }

      navigation.navigate('Main', { screen: 'ExercisesTab', params: { screen: 'ExerciseCatalog' } });
    } catch (error) {
      logger.error('Post-session save failed', error instanceof Error ? error : new Error(String(error)), 'PostSession');
      if (sessionSaved && journeyContext) {
        Alert.alert(tr("Practice saved"), tr("Your practice was saved, but the Journey could not continue. Try again to retry."));
      } else {
        Alert.alert(tr("Session not saved"), tr("Your practice could not be saved. Please try again."));
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleSave(null)} disabled={isSaving} accessibilityRole="button" accessibilityLabel={tr("Save practice without a stress rating and close")} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tr("Reflect")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Closing reassurance */}
        <View style={styles.celebrate}>
          <Text style={styles.celebrateTitle}>{exerciseName}</Text>
          <Text style={styles.celebrateMeta}>{durationLabel} {tr("of practice")}</Text>
        </View>

        {/* Main Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>{tr("How stressed do you feel now?")}</Text>
        </View>

        <StressRating value={postStressLevel} onChange={setPostStressLevel} disabled={isSaving} />

        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{feedback.title}</Text>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>{tr("What did you notice?")}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={tr("Add any observations during your session...")}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            editable={!isSaving}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button label={tr("Save practice")} onPress={() => handleSave(postStressLevel)} loading={isSaving} disabled={postStressLevel === null} />
        <TouchableOpacity style={styles.progressLink} onPress={() => handleSave(null)} disabled={isSaving} accessibilityRole="button">
          <Text style={styles.progressLinkText}>{tr("Save without a rating")}</Text>
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
    width: 48,
  },
  celebrate: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
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
  closeButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  feedback: { marginBottom: Spacing.xl, gap: Spacing.sm },
  feedbackTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  feedbackText: { color: Colors.textSecondary, fontSize: FontSize.md },
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
    minHeight: 48,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  progressLinkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
