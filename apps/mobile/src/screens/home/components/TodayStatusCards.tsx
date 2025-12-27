import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import { Card } from '../../../components';

interface TodayStatusCardsProps {
  totalSessions: number;
  totalMinutes: number;
}

export const TodayStatusCards: React.FC<TodayStatusCardsProps> = ({ totalSessions, totalMinutes }) => {
  return (
    <View style={styles.statusCards}>
      <Card style={styles.statusCardEnhanced}>
        <Ionicons name="fitness-outline" size={20} color={Colors.primary} style={styles.statusIcon} />
        <Text style={styles.statusLabel}>Sessions</Text>
        <Text style={styles.statusValue}>{totalSessions}</Text>
        <View style={styles.statusAccent} />
      </Card>
      <Card style={styles.statusCardEnhanced}>
        <Ionicons name="time-outline" size={20} color={Colors.primary} style={styles.statusIcon} />
        <Text style={styles.statusLabel}>Minutes</Text>
        <Text style={styles.statusValue}>{totalMinutes}</Text>
        <View style={styles.statusAccent} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusCardEnhanced: {
    flex: 1,
    paddingVertical: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  statusIcon: {
    marginBottom: Spacing.sm,
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statusAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
});
