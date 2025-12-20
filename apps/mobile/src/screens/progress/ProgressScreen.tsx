import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
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
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const ProgressScreen: React.FC = () => {
  const { sessions, isLoading, getSessionStats } = useSessions();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

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
      return { avgStress: 0, stressReduction: 0, totalSessions: 0, totalMinutes: 0 };
    }

    const totalMinutes = completedSessions.reduce((sum, s) => sum + Math.round(s.duration_seconds / 60), 0);
    
    // Calculate average post-stress
    const sessionsWithStress = completedSessions.filter((s) => s.post_stress_level !== null);
    const avgPostStress = sessionsWithStress.length > 0
      ? sessionsWithStress.reduce((sum, s) => sum + (s.post_stress_level || 0), 0) / sessionsWithStress.length
      : 0;
    
    // Calculate average stress reduction
    const sessionsWithBothStress = completedSessions.filter((s) => 
      s.pre_stress_level !== null && s.post_stress_level !== null
    );
    const avgReduction = sessionsWithBothStress.length > 0
      ? sessionsWithBothStress.reduce((sum, s) => 
          sum + ((s.pre_stress_level || 0) - (s.post_stress_level || 0)), 0
        ) / sessionsWithBothStress.length
      : 0;

    return {
      avgStress: Math.round(avgPostStress * 10) / 10,
      stressReduction: Math.round(avgReduction * 10) / 10,
      totalSessions: completedSessions.length,
      totalMinutes,
    };
  }, [filteredSessions]);

  // Get weekly chart data
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    return days.map((day, index) => {
      const adjustedIndex = (index + 1) % 7; // Convert Mon=0 to Sun=6
      const daysSinceStart = (dayOfWeek - adjustedIndex + 7) % 7;
      const targetDate = new Date(now.getTime() - daysSinceStart * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const daySessions = sessions.filter((s) => s.created_at.startsWith(dateStr) && s.completed_at);
      const hasSession = daySessions.length > 0;
      const avgStress = hasSession && daySessions.some((s) => s.post_stress_level)
        ? daySessions.reduce((sum, s) => sum + (s.post_stress_level || 5), 0) / daySessions.length
        : null;
      
      return { day, hasSession, avgStress };
    });
  }, [sessions]);

  // Calculate current streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Get unique session dates
    const sessionDates = new Set(
      sessions
        .filter((s) => s.completed_at)
        .map((s) => s.created_at.split('T')[0])
    );
    
    // Check from today backwards
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (sessionDates.has(dateStr)) {
        if (i === 0 || currentStreak > 0) {
          currentStreak++;
        }
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (currentStreak > 0 && i > 0) {
          // Streak broken
          currentStreak = currentStreak; // Keep the streak if today is missed but yesterday had session
        } else if (i === 0) {
          // Today has no session, check yesterday
        }
        tempStreak = 0;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  }, [sessions]);

  // Get last 28 days for calendar heatmap
  const calendarData = useMemo(() => {
    const days: { date: string; count: number; isToday: boolean }[] = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = sessions.filter((s) => s.created_at.startsWith(dateStr) && s.completed_at).length;
      days.push({ date: dateStr, count, isToday: i === 0 });
    }
    
    return days;
  }, [sessions]);

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

  return (
    <Screen style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History & Progress</Text>
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
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : '90 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Streak & Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streak.current}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </Card>
        </View>

        {/* Calendar Heatmap */}
        <Card style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Last 4 Weeks</Text>
          <View style={styles.calendarGrid}>
            {calendarData.map((day, index) => (
              <View
                key={index}
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
            <Text style={styles.legendText}>Less</Text>
            <View style={[styles.legendBox, { backgroundColor: Colors.backgroundLight }]} />
            <View style={[styles.legendBox, { backgroundColor: Colors.primaryLight }]} />
            <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>More</Text>
          </View>
        </Card>

        {/* Stress Trend Card */}
        <Card style={styles.trendCard}>
          <Text style={styles.trendLabel}>Stress Trend</Text>
          <View style={styles.trendHeader}>
            <Text style={styles.trendValue}>
              {stats.avgStress > 0 ? `Avg. ${stats.avgStress}` : 'No data'}
            </Text>
            {stats.stressReduction !== 0 && (
              <Text style={styles.trendChange}>
                Avg. reduction{' '}
                <Text style={{ color: stats.stressReduction > 0 ? Colors.success : Colors.error }}>
                  {stats.stressReduction > 0 ? '-' : '+'}{Math.abs(stats.stressReduction)}
                </Text>
              </Text>
            )}
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {weeklyData.map((data, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar,
                      data.hasSession && styles.chartBarActive,
                      data.avgStress !== null && { height: Math.max(20, (10 - data.avgStress) * 10) }
                    ]} 
                  />
                </View>
              ))}
            </View>
            <View style={styles.chartDays}>
              {weeklyData.map((data, index) => (
                <Text key={index} style={[styles.chartDay, data.hasSession && styles.chartDayActive]}>
                  {data.day}
                </Text>
              ))}
            </View>
          </View>
        </Card>

        {/* HRV Trend Card */}
        <Card style={styles.hrvCard}>
          <Text style={styles.hrvTitle}>HRV Trend</Text>
          <Text style={styles.hrvSubtitle}>
            Heart Rate Variability data is coming soon.
          </Text>
        </Card>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {filteredSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Complete your first exercise to see progress</Text>
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
                <Text style={styles.sessionName}>{session.exercise?.name || 'Exercise'}</Text>
                <Text style={styles.sessionMeta}>
                  {formatDate(session.created_at)} - {Math.round(session.duration_seconds / 60)} min
                </Text>
              </View>
              {session.pre_stress_level && session.post_stress_level && 
                renderStressChange(session.pre_stress_level, session.post_stress_level)
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
    backgroundColor: '#1E3A5F', // Slightly different blue as in design
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
    borderColor: Colors.textPrimary,
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
