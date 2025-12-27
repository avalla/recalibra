import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useSubscription, PREMIUM_FEATURES } from '@/hooks';
import { Screen } from '../../components';

/**
 * PaywallScreen - Wrapper that presents RevenueCat's native paywall
 * This screen immediately presents the RevenueCat paywall and handles the result
 */
export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { presentPaywall, isPremium, isLoading } = useSubscription();
  const [hasPresented, setHasPresented] = useState(false);

  useEffect(() => {
    // Present the RevenueCat paywall immediately when screen mounts
    const showPaywall = async () => {
      if (hasPresented) return;
      setHasPresented(true);

      const purchased = await presentPaywall();

      // Go back after paywall is dismissed
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    };

    if (!isLoading && !isPremium) {
      showPaywall();
    } else if (isPremium) {
      // Already premium, just go back
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [isLoading, isPremium, hasPresented, presentPaywall, navigation]);

  // Show loading state while RevenueCat paywall is being prepared
  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    fontFamily: FontFamily.regular,
  },
});
