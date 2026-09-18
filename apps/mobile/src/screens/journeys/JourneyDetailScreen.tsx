import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen } from '../../components';
import { BorderRadius, Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { returnToCenterJourney } from '../../data/journeys';
import { useJourney } from '../../hooks';
import type { RootStackParamList } from '../../types';

type Route = RouteProp<RootStackParamList, 'JourneyDetail'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const JourneyDetailScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const journey = useMemo(
    () => (route.params.journeyId === returnToCenterJourney.id ? returnToCenterJourney : null),
    [route.params.journeyId]
  );
  const { progress, isLoading, error, refresh, begin } = useJourney(route.params.journeyId);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!journey) {
    return (
      <Screen style={styles.container}>
        <Text style={styles.errorText}>Percorso non disponibile.</Text>
      </Screen>
    );
  }

  const completedCount = progress?.completedChapterIds.length ?? 0;
  const isComplete = completedCount >= journey.chapters.length;
  const activeIndex = Math.min(progress?.currentChapter ?? 0, journey.chapters.length - 1);

  const openChapter = async (chapterIndex: number) => {
    if (chapterIndex > (progress?.currentChapter ?? 0)) return;
    await begin();
    navigation.navigate('JourneyRunner', { journeyId: journey.id, chapterIndex });
  };

  const startJourney = async () => {
    const next = await begin();
    navigation.navigate('JourneyRunner', {
      journeyId: journey.id,
      chapterIndex: Math.min(next.currentChapter, journey.chapters.length - 1),
    });
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Torna indietro" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.eyebrow}>Percorso guidato</Text>
        <Text style={styles.title}>{journey.title}</Text>
        <Text style={styles.description}>{journey.description}</Text>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Il tuo percorso</Text>
            <Text style={styles.progressCount}>{completedCount}/{journey.chapters.length}</Text>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Progresso del percorso"
            accessibilityValue={{ min: 0, max: journey.chapters.length, now: completedCount }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${(completedCount / journey.chapters.length) * 100}%` }]} />
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.progressHint}>
            {isComplete ? 'Hai completato tutti i capitoli.' : 'Un capitolo alla volta, senza fretta.'}
          </Text>
        </Card>

        {isLoading ? <Text style={styles.muted}>Caricamento del progresso…</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.chapterList}>
          {journey.chapters.map((chapter, index) => {
            const completed = progress?.completedChapterIds.includes(chapter.id) ?? false;
            const locked = index > (progress?.currentChapter ?? 0);
            return (
              <TouchableOpacity
                key={chapter.id}
                accessibilityRole="button"
                accessibilityLabel={`Capitolo ${index + 1}: ${chapter.title}`}
                accessibilityHint={locked ? 'Completa prima i capitoli precedenti' : 'Apri il capitolo'}
                accessibilityState={{ disabled: locked, selected: completed }}
                disabled={locked}
                onPress={() => openChapter(index)}
                style={[styles.chapterRow, locked && styles.chapterLocked]}
              >
                <View style={[styles.chapterIcon, completed && styles.chapterIconComplete]}>
                  <Ionicons
                    name={completed ? 'checkmark' : locked ? 'lock-closed' : 'play'}
                    size={18}
                    color={completed ? Colors.background : locked ? Colors.textMuted : Colors.primary}
                  />
                </View>
                <View style={styles.chapterCopy}>
                  <Text style={styles.chapterNumber}>CAPITOLO {index + 1}</Text>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterMeta}>{chapter.durationMinutes} min · {chapter.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label={isComplete ? 'Ripercorri il percorso' : activeIndex === 0 ? 'Inizia il percorso' : 'Continua il percorso'}
          onPress={startJourney}
          disabled={isLoading}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  eyebrow: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.xl },
  title: { color: Colors.textPrimary, fontFamily: FontFamily.heading, fontSize: FontSize.xxxl, marginTop: Spacing.xs },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.md },
  progressCard: { marginTop: Spacing.xl, backgroundColor: Colors.backgroundElevated },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  progressCount: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.backgroundLight, overflow: 'hidden', marginTop: Spacing.md },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  progressHint: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.lg },
  errorText: { color: Colors.warning, fontSize: FontSize.md, margin: Spacing.lg },
  chapterList: { gap: Spacing.sm, marginVertical: Spacing.xl },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundCard },
  chapterLocked: { opacity: 0.55 },
  chapterIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  chapterIconComplete: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chapterCopy: { flex: 1 },
  chapterNumber: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.5 },
  chapterTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 2 },
  chapterMeta: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 19, marginTop: 3 },
});
