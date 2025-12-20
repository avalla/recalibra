import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { Screen } from '../../components';
import { useAuth } from '../../contexts';
import { useNotifications } from '../../hooks/useNotifications';
import { useSubscription } from '../../hooks/useSubscription';
import { useAppleHealth } from '../../hooks/useAppleHealth';
import { useHaptics } from '../../hooks/useHaptics';

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
  const { reminderSettings, saveSettings, sendTestNotification } = useNotifications();
  const { 
    isAvailable: healthAvailable, 
    isAuthorized: healthAuthorized, 
    requestAuthorization,
    getLatestHRV,
    getAverageHRV,
  } = useAppleHealth();
  const { isEnabled: hapticEnabled, setEnabled: setHapticEnabled, medium: hapticMedium } = useHaptics();
  
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [weeklySessionGoal, setWeeklySessionGoal] = useState(3);
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
  const [weeklyMinutesGoal, setWeeklyMinutesGoal] = useState(30);
  const [tempTime, setTempTime] = useState(reminderSettings.time);
  const [tempDays, setTempDays] = useState<number[]>(reminderSettings.days);

  useEffect(() => {
    if (!showReminderModal) return;
    setTempTime(reminderSettings.time);
    setTempDays(reminderSettings.days);
  }, [showReminderModal, reminderSettings.days, reminderSettings.time]);

  const handleReminderToggle = async (enabled: boolean) => {
    await saveSettings({ enabled });
    if (enabled) {
      Alert.alert('Reminders Enabled', `You'll be reminded at ${reminderSettings.time}`);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('Test Sent', 'Check your notifications in a few seconds!');
  };

  const formatReminderDays = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (reminderSettings.days.length === 7) return 'Every day';
    if (reminderSettings.days.length === 5 && 
        reminderSettings.days.every((d: number) => d >= 1 && d <= 5)) return 'Weekdays';
    if (reminderSettings.days.length === 2 && 
        reminderSettings.days.includes(0) && reminderSettings.days.includes(6)) return 'Weekends';
    return reminderSettings.days.map((n: number) => dayNames[n]).join(', ');
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

  const handleSoundSettings = () => {
    Alert.alert(
      'Sound Settings',
      'Choose your preferred sound',
      [
        { text: 'Calm Bell', onPress: () => {} },
        { text: 'Gentle Chime', onPress: () => {} },
        { text: 'Nature Sound', onPress: () => {} },
        { text: 'Silent', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
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

  const handleExportData = () => {
    Alert.alert(
      'Export My Data',
      'We will prepare your data export and send it to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            Alert.alert('Export Requested', 'You will receive an email with your data within 24 hours.');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                // TODO: Implement actual account deletion
              ]
            );
          }
        },
      ]
    );
  };

  const handleMedicalDisclaimer = () => {
    Alert.alert(
      'Medical Disclaimer',
      'Recalibra is designed for general wellness and relaxation purposes only. It is not intended to diagnose, treat, cure, or prevent any disease or medical condition.\n\nThe breathing exercises provided should not replace professional medical advice. If you have any respiratory conditions, cardiovascular issues, or other health concerns, please consult your healthcare provider before using this app.\n\nIf you experience any discomfort, dizziness, or adverse effects during exercises, stop immediately and seek medical attention if necessary.',
      [{ text: 'I Understand', style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://recalibra.com/privacy');
  };

  const handleSaveReminder = async () => {
    await saveSettings({ time: tempTime, days: tempDays });
    setShowReminderModal(false);
  };

  const toggleDay = (day: number) => {
    if (tempDays.includes(day)) {
      setTempDays(tempDays.filter((d) => d !== day));
    } else {
      setTempDays([...tempDays, day].sort());
    }
  };

  const handleSaveGoals = () => {
    // TODO: Persist goals
    setShowGoalsModal(false);
    Alert.alert('Goals Updated', `Weekly goal: ${weeklySessionGoal} sessions, ${weeklyMinutesGoal} minutes`);
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
              {subscription?.plan === 'lifetime' ? 'Lifetime access' : 
               subscription?.plan === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'}
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
            onPress={presentPaywall}
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

        {/* Reminders */}
        <Text style={styles.sectionTitle}>Daily Reminders</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="notifications-outline"
            iconColor={Colors.primary}
            label="Enable Reminders"
            hasSwitch
            hasArrow={false}
            switchValue={reminderSettings.enabled}
            onSwitchChange={handleReminderToggle}
          />
          <SettingsItem
            icon="time-outline"
            label="Reminder Time"
            value={reminderSettings.time}
            onPress={() => setShowReminderModal(true)}
          />
          <SettingsItem
            icon="calendar-outline"
            label="Reminder Days"
            value={formatReminderDays()}
            onPress={() => setShowReminderModal(true)}
          />
          <SettingsItem
            icon="paper-plane-outline"
            label="Test Notification"
            onPress={handleTestNotification}
          />
        </View>

        {/* Weekly Goals */}
        <Text style={styles.sectionTitle}>Weekly Goals</Text>
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="flag-outline"
            iconColor={Colors.success}
            label="Sessions per Week"
            value={`${weeklySessionGoal} sessions`}
            onPress={() => setShowGoalsModal(true)}
          />
          <SettingsItem
            icon="timer-outline"
            label="Minutes per Week"
            value={`${weeklyMinutesGoal} min`}
            onPress={() => setShowGoalsModal(true)}
          />
        </View>

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
            icon="volume-high-outline"
            label="Sound Settings"
            onPress={handleSoundSettings}
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
            icon="download-outline"
            label="Export My Data"
            onPress={handleExportData}
          />
          <SettingsItem
            icon="trash-outline"
            iconColor={Colors.error}
            label="Delete My Account"
            danger
            onPress={handleDeleteAccount}
          />
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

      {/* Reminder Settings Modal */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reminder Settings</Text>
            
            <Text style={styles.modalLabel}>Time</Text>
            <View style={styles.timeRow}>
              {['07:00', '08:00', '09:00', '12:00', '18:00', '20:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, tempTime === time && styles.timeChipActive]}
                  onPress={() => setTempTime(time)}
                >
                  <Text style={[styles.timeChipText, tempTime === time && styles.timeChipTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Days</Text>
            <View style={styles.daysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayChip, tempDays.includes(index) && styles.dayChipActive]}
                  onPress={() => toggleDay(index)}
                >
                  <Text style={[styles.dayChipText, tempDays.includes(index) && styles.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowReminderModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveReminder}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goals Modal */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Weekly Goals</Text>
            
            <Text style={styles.modalLabel}>Sessions per Week</Text>
            <View style={styles.goalRow}>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => setWeeklySessionGoal(Math.max(1, weeklySessionGoal - 1))}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.goalValue}>{weeklySessionGoal}</Text>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => setWeeklySessionGoal(Math.min(14, weeklySessionGoal + 1))}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Minutes per Week</Text>
            <View style={styles.goalRow}>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => setWeeklyMinutesGoal(Math.max(5, weeklyMinutesGoal - 5))}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.goalValue}>{weeklyMinutesGoal}</Text>
              <TouchableOpacity
                style={styles.goalButton}
                onPress={() => setWeeklyMinutesGoal(Math.min(300, weeklyMinutesGoal + 5))}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowGoalsModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveGoals}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.heading,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
  },
  timeChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  timeChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
  },
  dayChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dayChipTextActive: {
    color: Colors.textPrimary,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  goalButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    minWidth: 60,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
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
