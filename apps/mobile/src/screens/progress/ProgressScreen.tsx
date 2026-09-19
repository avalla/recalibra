import { localeTag, formatDate as localizedDate, formatNumber, formatMinutes } from '../../i18n/core';
import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import React, { useState, useMemo, useCallback } from 'react';
import { hasRecordedStressPair, summarizeSessionStress } from '../../utils/stress-rating';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Card, Screen } from '../../components';
import { useSessions } from '../../hooks';

const { width } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | '90days';

const getCategoryIcon = (category?: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'breathing':
      return 'leaf-outline';
    case 'water':
      return 'water-outline';
    case 'movement':
      return 'body-outline';
    case 'sensory':
      return 'ear-outline';
    default:
      return 'fitness-outline';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return tr("Today");
  if (diffDays === 1) return tr("Yesterday");

  return date.toLocaleDateString(localeTag(), { weekday: 'short', month: 'short', day: 'numeric' });
};

export const ProgressScreen: React.FC = () => {
  const { language } = useLanguage();
  const { localizedSessions: sessions, isLoading, refetch } = useSessions();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Sessions completed elsewhere (PostSession) live in a different hook instance,
  // so refresh on focus to avoid showing stale streak/stats/history.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Filter sessions by time range
  const filteredSessions = useMemo(() => {
    const now = new Date();
    let daysBack = 7;
    if (timeRange === 'month') daysBack = 30;
    if (timeRange === '90days') daysBack = 90;

    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return sessions.filter((s) => new Date(s.created_at) >= cutoff);
  }, [sessions, timeRange]);

  // Calculate stats for the filtered period
  const stats = useMemo(() => {
    const completedSessions = filteredSessions.filter((s) => s.completed_at);

    if (completedSessions.length === 0) {
      return { avgStress: null, stressReduction: null, totalSessions: 0, totalMinutes: 0 };
    }

    const totalMinutes = completedSessions.reduce((sum, s) => sum + Math.round(s.duration_seconds / 60), 0);

    const { averagePostStress, averageReduction } = summarizeSessionStress(completedSessions);

    return {
      avgStress: averagePostStress,
      stressReduction: averageReduction,
      totalSessions: completedSessions.length,
      totalMinutes,
    };
  }, [filteredSessions]);

  // Build chart data from the selected period so the range tabs change the visualization too.
  const chartData = useMemo(() => {
    const now = new Date();
    const getPoint = (label: string, start: Date, end: Date) => {
      const periodSessions = filteredSessions.filter((session) => {
        const createdAt = new Date(session.created_at);
        return session.completed_at && createdAt >= start && createdAt < end;
      });
      const avgStress = summarizeSessionStress(periodSessions).averagePostStress;
      return { label, hasSession: periodSessions.length > 0, avgStress };
    };

    if (timeRange === 'week') {
      const weekStart = new Date(now);
      const dayOffset = (now.getDay() + 6) % 7;
      weekStart.setDate(now.getDate() - dayOffset);
      weekStart.setHours(0, 0, 0, 0);

      return Array.from({ length: 7 }, (_, index) => {
        const start = new Date(weekStart);
        start.setDate(weekStart.getDate() + index);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        return getPoint(localizedDate(start, { weekday: 'short' }), start, end);
      });
    }

    const bucketSizeDays = timeRange === 'month' ? 7 : 30;
    const bucketCount = timeRange === 'month' ? 4 : 3;

    return Array.from({ length: bucketCount }, (_, index) => {
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      end.setDate(end.getDate() - (bucketCount - index - 1) * bucketSizeDays);
      const start = new Date(end);
      start.setDate(end.getDate() - bucketSizeDays);
      return getPoint(timeRange === 'month' ? `W${index + 1}` : `M${index + 1}`, start, end);
    });
  }, [filteredSessions, timeRange, language]);

  // Calculate current streak
  const streak = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const dayKey = (ms: number) => new Date(ms).toISOString().split('T')[0];

    // Unique days that have a completed session.
    const sessionDates = new Set(
      sessions
        .filter((s) => s.completed_at)
        .map((s) => s.created_at.split('T')[0])
    );

    const todayMs = new Date().getTime();

    // Longest streak: the longest run of consecutive days within the last year.
    let longestStreak = 0;
    let run = 0;
    for (let i = 0; i < 365; i++) {
      if (sessionDates.has(dayKey(todayMs - i * DAY_MS))) {
        run++;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    }

    // Current streak: consecutive days ending today. If today has no session
    // yet, we don't break the streak (grace day) and keep counting from
    // yesterday; the streak only ends at the first earlier day with no session.
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      if (sessionDates.has(dayKey(todayMs - i * DAY_MS))) {
        currentStreak++;
      } else if (i === 0) {
        continue; // today not done yet — grace, keep checking yesterday
      } else {
        break;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }, [sessions, language]);

  // Get last 28 days for calendar heatmap
  const calendarData = useMemo(() => {
    const days: { date: string; count: number; isToday: boolean }[] = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      const count = sessions.filter((s) => s.created_at.startsWith(dateStr) && s.completed_at).length;
      days.push({ date: dateStr, count, isToday: i === 0 });
    }

    return days;
  }, [sessions, language]);

  const renderStressChange = (pre: number, post: number) => {
    const change = post - pre;
    const color = change < 0 ? Colors.success : change > 0 ? Colors.error : Colors.textMuted;
    return (
      <View style={styles.stressChange}>
        <Text style={styles.stressValue}>{pre}</Text>
        <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
        <Text style={[styles.stressValue, { color }]}>{post}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen style={styles.container} edges={['top']}>
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{tr("History & Progress")}</Text>
          </View>
          <View style={[styles.skeletonBlock, { height: 80, marginBottom: Spacing.sm }]} />
          <View style={styles.statsRow}>
            <View style={[styles.skeletonBlock, { flex: 1, height: 80 }]} />
            <View style={[styles.skeletonBlock, { flex: 1, height: 80 }]} />
          </View>
          <View style={[styles.skeletonBlock, { height: 150, marginTop: Spacing.md, marginBottom: Spacing.md }]} />
          <View style={[styles.skeletonBlock, { height: 170 }]} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tr("History & Progress")}</Text>
        </View>

        {/* Time Range Tabs */}
        <View style={styles.timeRangeTabs}>
          {(['week', 'month', '90days'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeTab,
                timeRange === range && styles.timeRangeTabActive,
              ]}
              onPress={() => setTimeRange(range)}
              accessibilityRole="radio"
              accessibilityLabel={range === 'week' ? tr("Week") : range === 'month' ? tr("Month") : tr("90 days")}
              accessibilityState={{ selected: timeRange === range }}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'week' ? tr("Week") : range === 'month' ? tr("Month") : tr("90 days")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Streak hero */}
        <Card style={styles.streakCard}>
          <View style={styles.streakIconWrap}>
            <Ionicons name="flame" size={26} color={Colors.primary} />
          </View>
          <View style={styles.streakTextWrap}>
            <Text style={styles.streakValue}>
              {tr("days", { count: streak.current })}
            </Text>
            <Text style={styles.streakLabel}>
              {streak.current > 0 ? tr("Current streak") : tr("Start a streak today")}
              {streak.longest > streak.current ? tr(" · best {{count}}", { count: streak.longest }) : ''}
            </Text>
          </View>
        </Card>

        {/* Secondary stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-done-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>{tr("Sessions")}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>{tr("Minutes")}</Text>
          </Card>
        </View>

        {/* Calendar Heatmap */}
        <Card style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>{tr("Last 4 Weeks")}</Text>
          <View style={styles.calendarGrid}>
            {calendarData.map((day, index) => (
              <View
                key={index}
                accessible
                accessibilityLabel={tr("{{date}}, {{sessions}}{{today}}", { date: localizedDate(day.date, { dateStyle: 'long' }), sessions: tr('sessionCount', { count: day.count }), today: day.isToday ? tr(', today') : '' })}
                style={[
                  styles.calendarDay,
                  day.count > 0 && styles.calendarDayActive,
                  day.count > 1 && styles.calendarDayMultiple,
                  day.isToday && styles.calendarDayToday,
                ]}
              />
            ))}
          </View>
          <View style={styles.calendarLegend}>
            <Text style={styles.legendText}>{tr("Less")}</Text>
            <View style={[styles.legendBox, { backgroundColor: Colors.backgroundLight }]} />
            <View style={[styles.legendBox, { backgroundColor: Colors.primaryLight }]} />
            <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>{tr("More")}</Text>
          </View>
        </Card>

        {/* Stress Trend Card */}
        <Card style={styles.trendCard}>
          <Text style={styles.trendLabel}>{tr("Stress Trend")}</Text>
          <View style={styles.trendHeader}>
            <Text style={styles.trendValue}>
              {stats.avgStress !== null ? tr("Avg. {{value}}", { value: formatNumber(stats.avgStress) }) : tr("No data")}
            </Text>
            {stats.stressReduction !== null && (
              <Text style={styles.trendChange}>
                {tr("Avg. change")}{' '}
                <Text style={{ color: Colors.textSecondary }}>
                  {stats.stressReduction > 0 ? '−' : stats.stressReduction < 0 ? '+' : ''}{formatNumber(Math.abs(stats.stressReduction))}
                </Text>
              </Text>
            )}
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {chartData.map((data, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      data.avgStress !== null && styles.chartBarActive,
                      data.avgStress !== null && { height: Math.max(20, (10 - data.avgStress) * 10) }
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.chartDays}>
              {chartData.map((data, index) => (
                <Text key={index} style={[styles.chartDay, data.hasSession && styles.chartDayActive]}>
                  {data.label}
                </Text>
              ))}
            </View>
          </View>
          <Text style={styles.chartCaption}>
            {tr("Taller bars mean calmer {{period}}.", { period: timeRange === 'week' ? tr("days") : tr("periods") })}
          </Text>
        </Card>

        {/* HRV Trend (not yet available) */}
        <View style={styles.hrvNote}>
          <Ionicons name="pulse-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.hrvNoteText}>{tr("HRV trends coming soon")}</Text>
        </View>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>{tr("Recent Sessions")}</Text>
        {filteredSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{tr("No sessions yet")}</Text>
            <Text style={styles.emptySubtext}>{tr("Complete your first exercise to see progress")}</Text>
          </Card>
        ) : (
          filteredSessions.slice(0, 10).map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionIcon}>
                <Ionicons
                  name={getCategoryIcon(session.exercise?.category)}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>{session.exercise?.name || tr("Exercise")}</Text>
                <Text style={styles.sessionMeta}>
                  {formatDate(session.created_at)} · {formatMinutes(Math.round(session.duration_seconds / 60))}</Text>
              </View>
              {hasRecordedStressPair(session) &&
                renderStressChange(session.pre_stress_level, session.post_stress_level!)
              }
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
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
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
  },
  timeRangeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  timeRangeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  timeRangeTabActive: {
    backgroundColor: Colors.backgroundElevated,
  },
  timeRangeText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  timeRangeTextActive: {
    color: Colors.textPrimary,
  },
  trendCard: {
    marginBottom: Spacing.md,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  streakIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '1F',
  },
  streakTextWrap: {
    flex: 1,
  },
  streakValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.heading,
  },
  streakUnit: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  streakLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  chartCaption: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },
  skeletonBlock: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
  },
  hrvNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  hrvNoteText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  trendLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  trendValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  trendChange: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  chartContainer: {
    height: 120,
    marginTop: Spacing.md,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: Spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 8,
    height: '20%',
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  chartBarActive: {
    backgroundColor: Colors.primary,
  },
  chartDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  chartDay: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    flex: 1,
    textAlign: 'center',
  },
  chartDayActive: {
    color: Colors.primary,
  },
  hrvCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  hrvTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.heading,
  },
  hrvSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sessionMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  stressChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stressValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  // Stats row styles
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  // Calendar heatmap styles
  calendarCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calendarTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2 - 4 * 6) / 7,
    aspectRatio: 1,
    borderRadius: 4,
    backgroundColor: Colors.backgroundLight,
  },
  calendarDayActive: {
    backgroundColor: Colors.primaryLight,
  },
  calendarDayMultiple: {
    backgroundColor: Colors.primary,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
