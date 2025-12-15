import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  getCustomerInfo,
  checkPremiumStatus,
  getExpirationDate,
  getOfferings,
  restorePurchases as rcRestorePurchases,
  addCustomerInfoUpdateListener,
  getManagementURL,
  ENTITLEMENT_ID,
} from '../lib/revenuecat';
import { useAuth } from '../contexts';

export type SubscriptionPlan = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'none';

interface SubscriptionInfo {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  expirationDate: Date | null;
  managementURL: string | null;
  willRenew: boolean;
}

// Premium features list
export const PREMIUM_FEATURES = [
  { icon: '🌍', title: 'All Traditions', description: '8 cultural breathing traditions' },
  { icon: '🎵', title: 'All Audio', description: '19 ambient sounds & frequencies' },
  { icon: '📊', title: 'Advanced Stats', description: 'Detailed progress tracking' },
  { icon: '🎯', title: 'AI Recommendations', description: 'Personalized exercise suggestions' },
  { icon: '📴', title: 'Offline Mode', description: 'Practice without internet' },
  { icon: '🔔', title: 'Custom Reminders', description: 'Unlimited reminder settings' },
];

// Free exercises (hardcoded for quick checks)
const FREE_EXERCISE_NAMES = [
  'Box Breathing',
  '4-7-8 Breathing',
  'Diaphragmatic Breathing',
  'Resonant Breathing',
  'Physiological Sigh',
];

// Free audio presets
const FREE_AUDIO_PRESETS = ['silence', 'nature_rain', 'binaural_alpha'];

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

  // Parse customer info to subscription info
  const parseCustomerInfo = useCallback((info: CustomerInfo): SubscriptionInfo => {
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    const isActive = entitlement?.isActive === true;
    
    let plan: SubscriptionPlan | null = null;
    if (entitlement?.productIdentifier) {
      if (entitlement.productIdentifier.includes('monthly')) plan = 'monthly';
      else if (entitlement.productIdentifier.includes('yearly')) plan = 'yearly';
      else if (entitlement.productIdentifier.includes('lifetime')) plan = 'lifetime';
    }

    return {
      plan,
      status: isActive ? 'active' : 'none',
      expirationDate: entitlement?.expirationDate ? new Date(entitlement.expirationDate) : null,
      managementURL: info.managementURL || null,
      willRenew: entitlement?.willRenew === true,
    };
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

  // Check if specific exercise is free
  const isExerciseFree = useCallback((exerciseName: string, isPremiumFlag?: boolean) => {
    if (isPremiumFlag === false) return true;
    return FREE_EXERCISE_NAMES.some(name => 
      exerciseName.toLowerCase().includes(name.toLowerCase())
    );
  }, []);

  // Check if specific audio is free
  const isAudioFree = useCallback((audioPresetId: string) => {
    return FREE_AUDIO_PRESETS.includes(audioPresetId);
  }, []);

  // Check if user can access exercise
  const canAccessExercise = useCallback((exerciseName: string, isPremiumFlag?: boolean) => {
    if (isPremium) return true;
    return isExerciseFree(exerciseName, isPremiumFlag);
  }, [isPremium, isExerciseFree]);

  // Check if user can access audio
  const canAccessAudio = useCallback((audioPresetId: string) => {
    if (isPremium) return true;
    return isAudioFree(audioPresetId);
  }, [isPremium, isAudioFree]);

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
