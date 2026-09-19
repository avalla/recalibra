import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatMinutes, tr } from '../../../i18n/core';
import { Card } from '../../../components';
import { Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { Journey, JourneyProgress } from '../../../types';
import { getJourneyCompletion } from '../../../utils/journey-ui';

type Props = {
  journey: Journey;
  progress: JourneyProgress | null;
  durationMinutes: number;
  onPress: () => void;
};

export const JourneyCard: React.FC<Props> = ({ journey, progress, durationMinutes, onPress }) => {
  const completion = getJourneyCompletion(journey, progress);
  const isComplete = progress?.status === 'completed';
  const action = isComplete ? tr('Journey complete') : progress?.status === 'in_progress' ? tr('Continue journey') : tr('Start journey');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={`${action}: ${tr(journey.title)}`}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={isComplete ? 'checkmark-circle' : 'footsteps-outline'} size={22} color={Colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{tr('Journey')}</Text>
          <Text style={styles.title}>{tr(journey.title)}</Text>
          <Text style={styles.description} numberOfLines={2}>{tr(journey.description)}</Text>
          <View style={styles.meta}>
            <Text style={styles.progress}>{tr('{{completed}} of {{total}} steps', completion)}</Text>
            {durationMinutes > 0 ? <Text style={styles.progress}>{formatMinutes(durationMinutes)}</Text> : null}
          </View>
        </View>
        <View style={styles.action}>
          <Text style={styles.actionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.backgroundLight, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginTop: Spacing.xs },
  description: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  progress: { color: Colors.textMuted, fontSize: FontSize.xs },
  action: { alignItems: 'flex-end', gap: Spacing.xs, maxWidth: 92 },
  actionText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'right' },
});
