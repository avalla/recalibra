import { formatNumber } from '../../i18n/core';
import { LanguageSettings } from '../../components/LanguageSettings';
import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Screen } from '../../components';
import { useAppleHealth } from '@/hooks';
import { useHaptics } from '@/hooks';

const PRIVACY_URL = 'https://recalibra.it/privacy';
const TERMS_URL = 'https://recalibra.it/terms';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  hasArrow?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor = Colors.textPrimary,
  label,
  value,
  hasArrow = true,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={() => {
      if (hasSwitch && onSwitchChange) {
        onSwitchChange(!switchValue);
        return;
      }
      onPress?.();
    }}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hasSwitch ? tr("Double tap to toggle") : undefined}
  >
    <View style={[styles.settingsIcon, { backgroundColor: Colors.backgroundLight }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>
      {label}
    </Text>
    {value && <Text style={styles.settingsValue}>{value}</Text>}
    {hasSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: Colors.backgroundLight, true: Colors.primary }}
        thumbColor={Colors.textPrimary}
      />
    )}
    {hasArrow && !hasSwitch && (
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  useLanguage();
  const navigation = useNavigation<any>();
  const {
    isAvailable: healthAvailable,
    isAuthorized: healthAuthorized,
    requestAuthorization,
    getLatestHRV,
    getAverageHRV,
  } = useAppleHealth();
  const { isEnabled: hapticEnabled, setEnabled: setHapticEnabled, medium: hapticMedium } = useHaptics();
  const [latestHRV, setLatestHRV] = useState<number | null>(null);
  const [avgHRV, setAvgHRV] = useState<number | null>(null);

  // Fetch HRV data when authorized
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
    if (!value) {
      Alert.alert(
        tr("Apple Health Connection"),
        tr("To manage Apple Health permissions, please use iOS Settings."),
        [
          { text: tr("Cancel"), style: 'cancel' },
          { text: tr("Open Settings"), onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    if (value && !healthAuthorized) {
      const success = await requestAuthorization();
      if (!success) {
        Alert.alert(
          tr("Authorization Required"),
          tr("Please allow Recalibra to access Health data in Settings."),
          [
            { text: tr("Cancel"), style: 'cancel' },
            { text: tr("Open Settings"), onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  const handleHapticToggle = async (enabled: boolean) => {
    await setHapticEnabled(enabled);
    // Give haptic feedback when enabling
    if (enabled) {
      hapticMedium();
    }
  };

  const handleMedicalDisclaimer = () => {
    Alert.alert(
      tr("Medical Disclaimer"),
      tr("Recalibra is designed for general wellness and relaxation purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or medical condition.\n\nThe breathing exercises provided should not replace professional medical advice. If you have any respiratory conditions, cardiovascular issues, or other health concerns, please consult your healthcare provider before using this app.\n\nIf you experience any discomfort, dizziness, or adverse effects during exercises, stop immediately and seek medical attention if necessary."),
      [{ text: tr("I Understand"), style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(PRIVACY_URL);
  };

  const handleTermsOfUse = () => {
    Linking.openURL(TERMS_URL);
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
          <Text style={styles.headerTitle}>{tr("Settings")}</Text>
        </View>

        {/* Connections */}
        <Text style={styles.sectionTitle}>{tr("Connections")}</Text>
        {Platform.OS === 'ios' && healthAvailable && (
          <View style={styles.settingsSection}>
            <SettingsItem
              icon="heart"
              iconColor={Colors.error}
              label={tr("Connect to Apple Health")}
              hasSwitch
              hasArrow={false}
              switchValue={healthAuthorized}
              onSwitchChange={handleHealthToggle}
            />
            <Text style={styles.healthDisclosure}>
              {tr("Recalibra can read your Heart Rate Variability (HRV) from Apple Health to personalize stress insights and will write mindful minutes to Health when you complete sessions.")}</Text>
            {healthAuthorized && (latestHRV || avgHRV) && (
              <View style={styles.hrvContainer}>
                <View style={styles.hrvItem}>
                  <Text style={styles.hrvLabel}>{tr("Latest HRV")}</Text>
                  <Text style={styles.hrvValue}>{latestHRV ? `${formatNumber(latestHRV)} ms` : '--'}</Text>
                </View>
                <View style={styles.hrvDivider} />
                <View style={styles.hrvItem}>
                  <Text style={styles.hrvLabel}>{tr("7-Day Avg")}</Text>
                  <Text style={styles.hrvValue}>{avgHRV ? `${formatNumber(avgHRV)} ms` : '--'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Preferences */}
        <Text style={styles.sectionTitle}>{tr("Preferences")}</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="flash-outline"
            iconColor={Colors.primary}
            label={tr("Quick Start")}
            value={tr("Configure")}
            onPress={() => navigation.navigate('QuickStartPreferences', { from: 'settings' })}
          />
          <SettingsItem
            icon="phone-portrait-outline"
            label={tr("Haptic Feedback")}
            hasSwitch
            hasArrow={false}
            switchValue={hapticEnabled}
            onSwitchChange={handleHapticToggle}
          />
        </View>

        <View style={styles.settingsSection}><LanguageSettings /></View>

        {/* Data & Privacy */}
        <Text style={styles.sectionTitle}>{tr("Data & Privacy")}</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="medical-outline"
            label={tr("Medical Disclaimer")}
            onPress={handleMedicalDisclaimer}
          />
          <SettingsItem
            icon="shield-outline"
            label={tr("Privacy Policy")}
            onPress={handlePrivacyPolicy}
          />
          <SettingsItem
            icon="document-text-outline"
            label={tr("Terms of Use (EULA)")}
            onPress={handleTermsOfUse}
          />
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  settingsSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingsLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  settingsLabelDanger: {
    color: Colors.error,
  },
  settingsValue: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginRight: Spacing.sm,
  },
  healthDisclosure: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  // HRV Display
  hrvContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  hrvItem: {
    flex: 1,
    alignItems: 'center',
  },
  hrvDivider: {
    width: 1,
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: Spacing.md,
  },
  hrvLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  hrvValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
