import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  getCustomerInfo,
  checkPremiumStatus,
  getOfferings,
  restorePurchases as rcRestorePurchases,
  addCustomerInfoUpdateListener,
  ENTITLEMENT_ID,
} from '../lib/revenuecat';
import { useAuth } from '../contexts';
import {
  canAccessAudio as canAccessAudioRule,
  canAccessExercise as canAccessExerciseRule,
  isAudioFree as isAudioFreeRule,
  isExerciseFree as isExerciseFreeRule,
  parseSubscriptionInfo,
  type SubscriptionInfo,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '../features/subscription';

export type { SubscriptionPlan, SubscriptionStatus };

export { PREMIUM_FEATURES } from '../features/subscription';

// ⚠️ DEVELOPMENT ONLY - Set to true to bypass RevenueCat and grant all users premium access
const DEV_FORCE_PREMIUM = true;

export const useSubscription = () => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isPremium, setIsPremium] = useState(DEV_FORCE_PREMIUM);
  const [isLoading, setIsLoading] = useState(!DEV_FORCE_PREMIUM);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    plan: null,
    status: 'none',
    expirationDate: null,
    managementURL: null,
    willRenew: false,
  });

  const parseCustomerInfo = useCallback((info: CustomerInfo): SubscriptionInfo => {
    return parseSubscriptionInfo(info, { entitlementId: ENTITLEMENT_ID });
  }, []);

  // Fetch subscription status from RevenueCat
  const fetchSubscription = useCallback(async () => {
    // Skip RevenueCat if forcing premium in dev
    if (DEV_FORCE_PREMIUM) {
      console.log('[useSubscription] DEV_FORCE_PREMIUM enabled - skipping RevenueCat');
      setIsPremium(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      setIsPremium(checkPremiumStatus(info));
      setSubscriptionInfo(parseCustomerInfo(info));
      
      // Also fetch offerings
      const currentOffering = await getOfferings();
      setOffering(currentOffering);
    } catch (error) {
      console.error('[useSubscription] Error fetching:', error);
      // RevenueCat not configured - default to free tier
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [parseCustomerInfo]);

  // Listen for customer info updates
  useEffect(() => {
    fetchSubscription();
    
    const unsubscribe = addCustomerInfoUpdateListener((info) => {
      console.log('[useSubscription] Customer info updated');
      setCustomerInfo(info);
      setIsPremium(checkPremiumStatus(info));
      setSubscriptionInfo(parseCustomerInfo(info));
    });

    return unsubscribe;
  }, [fetchSubscription, parseCustomerInfo]);

  const isExerciseFree = useCallback((exerciseName: string, isPremiumFlag?: boolean) => {
    return isExerciseFreeRule(exerciseName, isPremiumFlag);
  }, []);

  const isAudioFree = useCallback((audioPresetId: string) => {
    return isAudioFreeRule(audioPresetId);
  }, []);

  const canAccessExercise = useCallback(
    (exerciseName: string, isPremiumFlag?: boolean) => {
      return canAccessExerciseRule(isPremium, exerciseName, isPremiumFlag);
    },
    [isPremium]
  );

  const canAccessAudio = useCallback(
    (audioPresetId: string) => {
      return canAccessAudioRule(isPremium, audioPresetId);
    },
    [isPremium]
  );

  /**
   * Present RevenueCat native paywall
   * Returns true if purchase was successful
   */
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywall();
      
      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          await fetchSubscription();
          return true;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('[useSubscription] Paywall not presented');
          return false;
        case PAYWALL_RESULT.ERROR:
          console.error('[useSubscription] Paywall error');
          return false;
        case PAYWALL_RESULT.CANCELLED:
          console.log('[useSubscription] Paywall cancelled');
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('[useSubscription] Error presenting paywall:', error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
      return false;
    }
  }, [fetchSubscription]);

  /**
   * Present paywall only if user doesn't have premium
   */
  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
      
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await fetchSubscription();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useSubscription] Error presenting paywall:', error);
      return false;
    }
  }, [fetchSubscription]);

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await rcRestorePurchases();
      setCustomerInfo(info);
      const restored = checkPremiumStatus(info);
      setIsPremium(restored);
      setSubscriptionInfo(parseCustomerInfo(info));
      
      if (restored) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
      
      return restored;
    } catch (error) {
      console.error('[useSubscription] Error restoring purchases:', error);
      Alert.alert('Error', 'Unable to restore purchases. Please try again.');
      return false;
    }
  }, [parseCustomerInfo]);

  /**
   * Open subscription management (App Store / Play Store)
   */
  const openManagement = useCallback(async () => {
    const url = subscriptionInfo.managementURL;
    if (url) {
      await Linking.openURL(url);
    } else {
      // Fallback to App Store subscriptions page
      if (Platform.OS === 'ios') {
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
    }
  }, [subscriptionInfo.managementURL]);

  /**
   * Present RevenueCat Customer Center
   * Self-service UI for subscription management, cancellation, refunds
   */
  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo }) => {
            console.log('[CustomerCenter] Restore completed');
            setCustomerInfo(customerInfo);
            setIsPremium(checkPremiumStatus(customerInfo));
            setSubscriptionInfo(parseCustomerInfo(customerInfo));
          },
          onRestoreFailed: ({ error }) => {
            console.error('[CustomerCenter] Restore failed:', error);
            Alert.alert('Error', 'Failed to restore purchases. Please try again.');
          },
          onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
            console.log('[CustomerCenter] Feedback completed:', feedbackSurveyOptionId);
          },
        },
      });
    } catch (error) {
      console.error('[useSubscription] Error presenting customer center:', error);
      // Fallback to management URL
      await openManagement();
    }
  }, [openManagement, parseCustomerInfo]);

  /**
   * Get packages from current offering
   */
  const getPackages = useCallback((): PurchasesPackage[] => {
    return offering?.availablePackages || [];
  }, [offering]);

  return {
    // State
    isPremium,
    isLoading,
    customerInfo,
    subscription: subscriptionInfo,
    offering,
    
    // Access checks
    isExerciseFree,
    isAudioFree,
    canAccessExercise,
    canAccessAudio,
    
    // Actions
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restorePurchases,
    openManagement,
    getPackages,
    refresh: fetchSubscription,
  };
};
