import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { BorderRadius, Colors, FontFamily, FontSize, FontWeight, Spacing } from '../../constants';
import { Screen } from '../../components';
import { useExercises } from '../../hooks';
import { tr } from '../../i18n/core';
import type { RootStackParamList } from '../../types';

type SafetyRouteProps = RouteProp<RootStackParamList, 'ExerciseSafety'>;

export const ExerciseSafetyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<SafetyRouteProps>();
  const { localizedExercises, isLoading } = useExercises();
  const exercise = useMemo(() => localizedExercises.find((item) => item.id === route.params.exerciseId), [localizedExercises, route.params.exerciseId]);

  if (isLoading || !exercise) {
    return <Screen style={styles.container} edges={['top', 'bottom']}><View style={styles.center}><Text style={styles.bodyText}>{tr('Loading...')}</Text></View></Screen>;
  }

  const continueToPreparation = () => navigation.replace('ExercisePreparation', {
    exerciseId: exercise.id,
    journeyContext: route.params.journeyContext,
  });

  return (
    <Screen style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={tr('Go back')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.iconWrap}><Ionicons name="shield-checkmark-outline" size={34} color={Colors.warning} /></View>
        <Text style={styles.kicker}>{exercise.name}</Text>
        <Text style={styles.title}>{tr('Before you begin')}</Text>
        <Text style={styles.intro}>{tr('Take a moment to check that this practice feels right for you today.')}</Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{exercise.safety_warning}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={continueToPreparation} accessibilityRole="button" accessibilityLabel={tr('I understand')}>
          <Text style={styles.primaryButtonText}>{tr('I understand')}</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard },
  iconWrap: { width: 72, height: 72, marginTop: Spacing.xxl, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  kicker: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xl },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontFamily: FontFamily.heading, marginTop: Spacing.xs },
  intro: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 25, marginTop: Spacing.md },
  warningBox: { marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(245, 158, 11, 0.10)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.30)' },
  warningText: { color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: 25 },
  bodyText: { color: Colors.textSecondary, fontSize: FontSize.md },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  primaryButton: { minHeight: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  primaryButtonText: { color: Colors.background, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
