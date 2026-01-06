import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { AppConfig } from '../config';

// RevenueCat Configuration
// Get your API keys from RevenueCat Dashboard → Project Settings → API Keys

// Get the correct API key based on platform
const getApiKey = (): string => {
  if (Platform.OS === 'ios') {
    return AppConfig.REVENUECAT_IOS_KEY;
  }
  if (Platform.OS === 'android') {
    return AppConfig.REVENUECAT_ANDROID_KEY;
  }
  // Fallback for web/other - won't work but prevents crash
  return AppConfig.REVENUECAT_IOS_KEY;
};

export const isRevenueCatConfigured = (): boolean => {
  return Boolean(getApiKey());
};

const assertRevenueCatConfigured = (): void => {
  if (!isRevenueCatConfigured()) {
    throw new Error('RevenueCat not configured');
  }
};

// Entitlement ID - this should match what you configured in RevenueCat dashboard
export const ENTITLEMENT_ID = 'recalibra_pro';

// Product IDs - these should match your offerings in RevenueCat
export const PRODUCT_IDS = {
  MONTHLY: 'com.recalibra.subscription.monthly',
  YEARLY: 'com.recalibra.subscription.yearly',
};

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts
 */
export const initializeRevenueCat = async (userId?: string, isAnonymous?: boolean): Promise<void> => {
  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('[RevenueCat] Missing API key - skipping initialization');
      return;
    }

    // Configure with API key
    // Using the simpler configuration method for better compatibility
    Purchases.configure({
      apiKey,
      appUserID: isAnonymous ? userId || null : userId || null,
    });
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    // Don't throw - let app continue without RevenueCat if it fails
    console.warn('[RevenueCat] App will continue without subscription features');
  }
};

/**
 * Login user to RevenueCat (call when user authenticates)
 * For anonymous users upgrading to real account
 */
export const loginUser = async (userId: string, previousAnonymousId?: string): Promise<CustomerInfo> => {
  try {
    assertRevenueCatConfigured();
    // If upgrading from anonymous, identify with the same anonymous ID first
    if (previousAnonymousId) {
      await Purchases.logIn(previousAnonymousId);
    }
    
    // Then log in with the new user ID
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
    throw error;
  }
};

/**
 * Logout user from RevenueCat (call when user signs out)
 */
export const logoutUser = async (): Promise<CustomerInfo> => {
  try {
    assertRevenueCatConfigured();
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
    throw error;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    assertRevenueCatConfigured();
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    throw error;
  }
};

/**
 * Check if user has active premium entitlement
 */
export const checkPremiumStatus = (customerInfo: CustomerInfo): boolean => {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return entitlement?.isActive === true;
};

/**
 * Get subscription expiration date
 */
export const getExpirationDate = (customerInfo: CustomerInfo): Date | null => {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (entitlement?.expirationDate) {
    return new Date(entitlement.expirationDate);
  }
  return null;
};

/**
 * Get current offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    assertRevenueCatConfigured();
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (selectedPackage: PurchasesPackage): Promise<CustomerInfo | null> => {
  try {
    assertRevenueCatConfigured();
    const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
    return customerInfo;
  } catch (error: unknown) {
    const maybeError = error as { userCancelled?: boolean };
    if (maybeError?.userCancelled === true) {
      return null;
    }
    console.error('[RevenueCat] Error purchasing package:', error);
    throw error;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    assertRevenueCatConfigured();
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Add customer info update listener
 */
export const addCustomerInfoUpdateListener = (
  callback: (customerInfo: CustomerInfo) => void
): (() => void) => {
  Purchases.addCustomerInfoUpdateListener(callback);
  // RevenueCat RN SDK doesn't return a remove function, 
  // listener persists for app lifecycle
  return () => {};
};

/**
 * Get subscription management URL (for iOS)
 */
export const getManagementURL = (customerInfo: CustomerInfo): string | null => {
  return customerInfo.managementURL || null;
};
