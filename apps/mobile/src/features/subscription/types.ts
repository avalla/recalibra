import type { CustomerInfo } from 'react-native-purchases';

export type SubscriptionPlan = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'none';

export interface SubscriptionInfo {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  expirationDate: Date | null;
  managementURL: string | null;
  willRenew: boolean;
}

export interface PremiumFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ParseSubscriptionInfoOptions {
  entitlementId: string;
}

export function parseSubscriptionInfo(
  info: CustomerInfo,
  options: ParseSubscriptionInfoOptions
): SubscriptionInfo {
  const entitlement = info.entitlements.active[options.entitlementId];
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
}
