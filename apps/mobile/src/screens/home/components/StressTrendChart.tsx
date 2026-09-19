import { useLanguage } from '../../../i18n/LanguageProvider';
import { tr } from '../../../i18n/core';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Line, Circle, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface StressTrendPoint {
  day: string;
  value: number;
}

interface StressTrendChartProps {
  stressTrend: StressTrendPoint[];
  avgStressReduction: number;
}

export const StressTrendChart: React.FC<StressTrendChartProps> = ({ stressTrend, avgStressReduction }) => {
  useLanguage();
  const Gradient = LinearGradient as unknown as React.ComponentType<any>;

  return (
    <Gradient colors={[Colors.backgroundCard, Colors.backgroundCard + 'CC']} style={styles.chartCardGradient}>
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Ionicons name="trending-down-outline" size={20} color={Colors.primary} />
          <Text style={styles.chartTitle}>{tr("Last 7 days")}</Text>
          <Text style={styles.chartValue}>{avgStressReduction > 0 ? `-${avgStressReduction}%` : tr("No data")}</Text>
        </View>
        <View style={styles.chartContainer}>
          <Svg width="100%" height={120}>
            {Array.from({ length: 4 }, (_, i) => (
              <Line
                key={String(i)}
                x1="0"
                y1={i * 30}
                x2="100%"
                y2={i * 30}
                stroke={Colors.border}
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            <Polyline
              points={stressTrend
                .map((point, index) => {
                  const x = (index / (stressTrend.length - 1)) * 100;
                  const y = 120 - (point.value / 80) * 120;
                  return `${x},${y}`;
                })
                .join(' ')}
              stroke={Colors.primary}
              strokeWidth="3"
              fill="none"
            />
            {stressTrend.map((point, index) => {
              const x = (index / (stressTrend.length - 1)) * 100;
              const y = 120 - (point.value / 80) * 120;
              return (
                <Circle
                  key={`${point.day}-${index}`}
                  cx={x + '%'}
                  cy={y}
                  r="4"
                  fill={Colors.primary}
                  stroke={Colors.background}
                  strokeWidth="2"
                />
              );
            })}
          </Svg>
          <View style={styles.chartLabels}>
            {stressTrend.map((point, index) => (
              <Text key={`${point.day}-${index}`} style={styles.chartLabel}>
                {point.day}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </Gradient>
  );
};

const styles = StyleSheet.create({
  chartCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: 1,
    marginHorizontal: 0,
  },
  chartCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg - 1,
    padding: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  chartValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  chartLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
});
