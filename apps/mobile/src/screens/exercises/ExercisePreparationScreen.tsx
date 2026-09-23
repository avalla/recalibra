import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { BorderRadius, Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { Screen } from '../../components';
import { StressRating } from '../../components/StressRating';
import { useExercises } from '../../hooks';
import { tr } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { getExercisePlan, scaleGuidedPlan } from '../../data/exercise-guidance';
import { loadGuidedPreferences, saveGuidedPreferences } from '../../utils/guided-preferences';
import type { GuidanceMode, GuidanceSpeed, RootStackParamList } from '../../types';

type PreparationRouteProps = RouteProp<RootStackParamList, 'ExercisePreparation'>;

export const ExercisePreparationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PreparationRouteProps>();
  const { localizedExercises, isLoading } = useExercises();
  const { language } = useLanguage();
  const exercise = useMemo(() => localizedExercises.find((item) => item.id === route.params.exerciseId), [localizedExercises, route.params.exerciseId]);
  const plan = useMemo(() => exercise ? getExercisePlan(exercise, language === 'en' ? 'en' : 'it') : null, [exercise, language]);
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>('automatic');
  const [guidanceSpeed, setGuidanceSpeed] = useState<GuidanceSpeed>('normal');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [preStressLevel, setPreStressLevel] = useState<number | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadGuidedPreferences().then((preferences) => {
      if (!mounted) return;
      setGuidanceMode(plan?.mode === 'automatic' ? preferences.guidanceMode : 'manual');
      setGuidanceSpeed(preferences.guidanceSpeed);
      setAudioEnabled(preferences.audioEnabled);
    });
    return () => { mounted = false; };
  }, [plan?.mode]);

  if (isLoading || !exercise || !plan) {
    return <Screen style={styles.container} edges={['top', 'bottom']}><View style={styles.center}><Text style={styles.muted}>{tr('Loading...')}</Text></View></Screen>;
  }

  const automaticSupported = plan.mode === 'automatic';
  const setMode = (mode: GuidanceMode) => setGuidanceMode(automaticSupported ? mode : 'manual');

  const start = async () => {
    const preferences = { guidanceMode: automaticSupported ? guidanceMode : 'manual', guidanceSpeed, audioEnabled };
    await saveGuidedPreferences(preferences);
    navigation.replace('ExerciseSession', {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationMinutes: exercise.duration_minutes,
      audioPreset: exercise.audio_preset,
      exerciseCategory: exercise.category,
      breathingPattern: exercise.breathing_pattern,
      origin: exercise.origin,
      history: exercise.history,
      benefits: exercise.benefits,
      tips: exercise.tips,
      instructions: exercise.instructions,
      safetyWarning: exercise.safety_warning,
      guidedPlan: scaleGuidedPlan(plan, guidanceSpeed),
      guidanceMode: preferences.guidanceMode,
      guidanceSpeed,
      audioEnabled,
      preStressLevel,
      journeyContext: route.params.journeyContext,
    });
  };

  return (
    <Screen style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={tr('Go back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{tr('Get ready')}</Text>
        <Text style={styles.subtitle}>{tr('Sit comfortably and relax your shoulders.')}</Text>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}><Ionicons name="sparkles-outline" size={25} color={Colors.primary} /></View>
          <View style={styles.summaryText}><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.muted}>{tr('The session lasts about {{minutes}} minutes.', { minutes: exercise.duration_minutes })}</Text></View>
        </View>

        {automaticSupported ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tr('Guidance')}</Text>
            <View style={styles.choiceRow}>
              <Choice label={tr('Automatic')} selected={guidanceMode === 'automatic'} onPress={() => setMode('automatic')} />
              <Choice label={tr('Manual')} selected={guidanceMode === 'manual'} onPress={() => setMode('manual')} />
            </View>
            <Text style={styles.hint}>{guidanceMode === 'automatic' ? tr('The exercise advances while you focus on the movement.') : tr('Advance when you are ready.')}</Text>
          </View>
        ) : (
          <View style={styles.note}><Ionicons name="hand-left-outline" size={18} color={Colors.primary} /><Text style={styles.hint}>{tr('This exercise uses manual guidance. You decide when to move on.')}</Text></View>
        )}

        {automaticSupported && plan.supportsSpeed ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tr('Speed')}</Text>
            <View style={styles.choiceRow}>
              <Choice label={tr('Slow')} selected={guidanceSpeed === 'slow'} onPress={() => setGuidanceSpeed('slow')} />
              <Choice label={tr('Normal')} selected={guidanceSpeed === 'normal'} onPress={() => setGuidanceSpeed('normal')} />
              <Choice label={tr('Fast')} selected={guidanceSpeed === 'fast'} onPress={() => setGuidanceSpeed('fast')} />
            </View>
          </View>
        ) : null}

        <View style={styles.settingRow}>
          <View style={styles.settingText}><Text style={styles.sectionTitle}>{tr('Voice guidance')}</Text><Text style={styles.hint}>{tr('Uses the voice available on your device. Text stays visible if it is unavailable.')}</Text></View>
          <Switch value={audioEnabled} onValueChange={setAudioEnabled} trackColor={{ false: Colors.backgroundLight, true: Colors.primaryDark }} thumbColor={audioEnabled ? Colors.primary : Colors.textMuted} accessibilityLabel={tr('Voice guidance')} />
        </View>

        <TouchableOpacity style={styles.checkInToggle} onPress={() => setShowCheckIn((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: showCheckIn }}>
          <View><Text style={styles.sectionTitle}>{tr('Optional check-in')}</Text><Text style={styles.hint}>{tr('Your answer is saved with the session, but does not block it.')}</Text></View>
          <Ionicons name={showCheckIn ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
        </TouchableOpacity>
        {showCheckIn ? <StressRating value={preStressLevel} onChange={setPreStressLevel} /> : null}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={start} accessibilityRole="button" accessibilityLabel={tr('Start')}>
          <Text style={styles.primaryButtonText}>{tr('Start')}</Text><Ionicons name="play" size={19} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity style={[styles.choice, selected && styles.choiceSelected]} onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  backButton: { width: 48, height: 48, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontFamily: FontFamily.heading, marginTop: Spacing.xxl },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 25, marginTop: Spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl, padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundCard },
  summaryIcon: { width: 48, height: 48, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,212,191,0.12)' },
  summaryText: { flex: 1 },
  exerciseName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  section: { marginTop: Spacing.xl },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  choiceRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  choice: { flex: 1, minHeight: 48, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(45,212,191,0.16)' },
  choiceText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  choiceTextSelected: { color: Colors.primary },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20, flex: 1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xl, padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.backgroundCard },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl, paddingVertical: Spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  settingText: { flex: 1, gap: Spacing.xs },
  checkInToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, paddingVertical: Spacing.md },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20 },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  primaryButton: { minHeight: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  primaryButtonText: { color: Colors.background, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
