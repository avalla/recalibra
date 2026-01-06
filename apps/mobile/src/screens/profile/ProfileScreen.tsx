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
import { useAuth } from '../../contexts';
import { useSubscription } from '@/hooks';
import { useAppleHealth } from '@/hooks';
import { useHaptics } from '@/hooks';

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
    accessibilityHint={hasSwitch ? 'Double tap to toggle' : undefined}
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
  const { signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { isPremium, subscription, presentPaywall, presentCustomerCenter } = useSubscription();
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
        'Apple Health Connection',
        'To manage Apple Health permissions, please use iOS Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    if (value && !healthAuthorized) {
      const success = await requestAuthorization();
      if (!success) {
        Alert.alert(
          'Authorization Required',
          'Please allow Recalibra to access Health data in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
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
      'Medical Disclaimer',
      'Recalibra is designed for general wellness and relaxation purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or medical condition.\n\nThe breathing exercises provided should not replace professional medical advice. If you have any respiratory conditions, cardiovascular issues, or other health concerns, please consult your healthcare provider before using this app.\n\nIf you experience any discomfort, dizziness, or adverse effects during exercises, stop immediately and seek medical attention if necessary.',
      [{ text: 'I Understand', style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://recalibra.it/privacy');
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
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Premium Section */}
        {isPremium ? (
          <View style={styles.premiumCard}>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            <Text style={styles.premiumTitle}>You're Premium!</Text>
            <Text style={styles.premiumSubtitle}>
              {subscription?.plan === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'}
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={presentCustomerCenter}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => {
              const parent = navigation.getParent?.();
              if (parent?.navigate) {
                parent.navigate('Paywall');
                return;
              }
              navigation.navigate('Paywall');
            }}
          >
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeEmoji}>✨</Text>
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeSubtitle}>Unlock all exercises & features</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Connections */}
        <Text style={styles.sectionTitle}>Connections</Text>
        {Platform.OS === 'ios' && healthAvailable && (
          <View style={styles.settingsSection}>
            <SettingsItem
              icon="heart"
              iconColor={Colors.error}
              label="Connect to Apple Health"
              hasSwitch
              hasArrow={false}
              switchValue={healthAuthorized}
              onSwitchChange={handleHealthToggle}
            />
            {healthAuthorized && (latestHRV || avgHRV) && (
              <View style={styles.hrvContainer}>
                <View style={styles.hrvItem}>
                  <Text style={styles.hrvLabel}>Latest HRV</Text>
                  <Text style={styles.hrvValue}>{latestHRV ? `${latestHRV} ms` : '--'}</Text>
                </View>
                <View style={styles.hrvDivider} />
                <View style={styles.hrvItem}>
                  <Text style={styles.hrvLabel}>7-Day Avg</Text>
                  <Text style={styles.hrvValue}>{avgHRV ? `${avgHRV} ms` : '--'}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="flash-outline"
            iconColor={Colors.primary}
            label="Quick Start"
            value="Configure"
            onPress={() => navigation.navigate('QuickStartPreferences', { from: 'settings' })}
          />
          <SettingsItem
            icon="phone-portrait-outline"
            label="Haptic Feedback"
            hasSwitch
            hasArrow={false}
            switchValue={hapticEnabled}
            onSwitchChange={handleHapticToggle}
          />
        </View>

        {/* Data & Privacy */}
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="medical-outline"
            label="Medical Disclaimer"
            onPress={handleMedicalDisclaimer}
          />
          <SettingsItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  logoutText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  // Premium styles
  premiumCard: {
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  premiumBadgeText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  premiumTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
  },
  premiumSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  upgradeCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  upgradeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
  },
  upgradeSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  manageButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
