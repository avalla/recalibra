import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Screen } from '../../components';
import { useAppleHealth, useSubscription } from '../../hooks';
import { useAuth } from '@/contexts';
import {
  loadBreathingVisualizationMode,
  loadBreathingCurvePresetOverride,
  saveBreathingVisualizationMode,
  saveBreathingCurvePresetOverride,
  type BreathingCurvePresetOverride,
  type BreathingVisualizationMode,
} from '../../utils/breath-visualization';

const HEALTH_SYNC_KEY = '@recalibra:health_sync_enabled';
const PRIVACY_URL = 'https://recalibra.it/privacy';
const TERMS_URL = 'https://recalibra.it/terms';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const {
    isAvailable: healthAvailable,
    isAuthorized: healthAuthorized,
    requestAuthorization,
    getAverageHRV,
    getLatestHRV,
  } = useAppleHealth();

  const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
  const [latestHRV, setLatestHRV] = useState<number | null>(null);
  const [avgHRV, setAvgHRV] = useState<number | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [breathingVisualizationMode, setBreathingVisualizationMode] =
    useState<BreathingVisualizationMode>('circle');
  const [curvePresetOverride, setCurvePresetOverride] =
    useState<BreathingCurvePresetOverride>('auto');

  // Load health sync preference
  useEffect(() => {
    const loadPreference = async () => {
      const value = await AsyncStorage.getItem(HEALTH_SYNC_KEY);
      setHealthSyncEnabled(value === 'true');
    };
    loadPreference();
  }, []);

  useEffect(() => {
    const loadVisualizationPreference = async () => {
      const [mode, presetOverride] = await Promise.all([
        loadBreathingVisualizationMode(),
        loadBreathingCurvePresetOverride(),
      ]);
      setBreathingVisualizationMode(mode);
      setCurvePresetOverride(presetOverride);
    };
    loadVisualizationPreference();
  }, []);

  // Fetch HRV data if authorized
  useEffect(() => {
    const fetchHRVData = async () => {
      if (healthAuthorized) {
        const latest = await getLatestHRV();
        const avg = await getAverageHRV(7);
        setLatestHRV(latest);
        setAvgHRV(avg);
      }
    };
    fetchHRVData();
  }, [healthAuthorized, getLatestHRV, getAverageHRV]);

  const handleHealthToggle = async (value: boolean) => {
    if (value && !healthAuthorized) {
      setIsLoadingHealth(true);
      const success = await requestAuthorization();
      setIsLoadingHealth(false);

      if (!success) {
        Alert.alert(
          'Authorization Required',
          'Please allow Recalibra to access Health data in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }

    setHealthSyncEnabled(value);
    await AsyncStorage.setItem(HEALTH_SYNC_KEY, value ? 'true' : 'false');
  };

  const handleVisualizationToggle = async (value: boolean) => {
    const nextMode: BreathingVisualizationMode = value ? 'graph' : 'circle';
    setBreathingVisualizationMode(nextMode);
    await saveBreathingVisualizationMode(nextMode);
  };

  const handleCurvePresetOverride = async (preset: BreathingCurvePresetOverride) => {
    setCurvePresetOverride(preset);
    await saveBreathingCurvePresetOverride(preset);
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apple Health Section */}
        {Platform.OS === 'ios' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apple Health</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="heart" size={24} color={Colors.error} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync with Health</Text>
                  <Text style={styles.settingDescription}>
                    Save mindful minutes to Apple Health
                  </Text>
                </View>
              </View>
              <Switch
                value={healthSyncEnabled && healthAuthorized}
                onValueChange={handleHealthToggle}
                disabled={!healthAvailable || isLoadingHealth}
                trackColor={{ false: Colors.backgroundCard, true: Colors.primary }}
                thumbColor={Colors.textPrimary}
              />
            </View>

            <Text style={styles.healthDisclosure}>
              Recalibra can read your Heart Rate Variability (HRV) from Apple Health to personalize stress
              insights and will write mindful minutes to Health when you complete sessions.
            </Text>

            {healthAuthorized && (
              <View style={styles.healthStats}>
                <View style={styles.healthStatItem}>
                  <Text style={styles.healthStatLabel}>Latest HRV</Text>
                  <Text style={styles.healthStatValue}>
                    {latestHRV ? `${latestHRV} ms` : '--'}
                  </Text>
                </View>
                <View style={styles.healthStatDivider} />
                <View style={styles.healthStatItem}>
                  <Text style={styles.healthStatLabel}>7-Day Avg</Text>
                  <Text style={styles.healthStatValue}>
                    {avgHRV ? `${avgHRV} ms` : '--'}
                  </Text>
                </View>
              </View>
            )}

            {!healthAvailable && (
              <Text style={styles.healthNotAvailable}>
                Apple Health is not available on this device
              </Text>
            )}
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="person" size={24} color={Colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingDescription}>
                  {user?.email || 'Not signed in'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="star" size={24} color={Colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Subscription</Text>
                <Text style={styles.settingDescription}>
                  {isPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="pulse-outline" size={24} color={Colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Breathing Visual</Text>
                <Text style={styles.settingDescription}>Use the animated graph view</Text>
              </View>
            </View>
            <Switch
              value={breathingVisualizationMode === 'graph'}
              onValueChange={handleVisualizationToggle}
              trackColor={{ false: Colors.border, true: Colors.primary + '55' }}
              thumbColor={breathingVisualizationMode === 'graph' ? Colors.primary : Colors.textMuted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="analytics-outline" size={24} color={Colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Breathing Curve</Text>
                <Text style={styles.settingDescription}>Control the graph intensity</Text>
              </View>
            </View>
            <View style={styles.curvePresetRow}>
              {([
                { id: 'auto', label: 'Auto' },
                { id: 'relax', label: 'Relax' },
                { id: 'energy', label: 'Energy' },
              ] as const).map((item) => {
                const isActive = curvePresetOverride === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.curvePresetPill, isActive && styles.curvePresetPillActive]}
                    onPress={() => handleCurvePresetOverride(item.id)}
                  >
                    <Text style={[styles.curvePresetText, isActive && styles.curvePresetTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('QuickStartPreferences', { from: 'settings' })}
            activeOpacity={0.8}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="flash-outline" size={24} color={Colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Quick Start</Text>
                <Text style={styles.settingDescription}>Configure your shortcut</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL(PRIVACY_URL)}
            activeOpacity={0.8}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={24} color={Colors.textMuted} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL(TERMS_URL)}
            activeOpacity={0.8}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={24} color={Colors.textMuted} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Terms of Use (EULA)</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle" size={24} color={Colors.textMuted} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  curvePresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  curvePresetPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  curvePresetPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  curvePresetText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  curvePresetTextActive: {
    color: Colors.background,
  },
  healthStats: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  healthStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  healthStatDivider: {
    width: 1,
    backgroundColor: Colors.backgroundLight,
    marginHorizontal: Spacing.md,
  },
  healthStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  healthStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  healthDisclosure: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  healthNotAvailable: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: 50,
  },
});
