import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useSubscription, PREMIUM_FEATURES } from '@/hooks';
import { Screen } from '../../components';

/**
 * PaywallScreen - Wrapper that presents RevenueCat's native paywall
 * This screen immediately presents the RevenueCat paywall and handles the result
 */
export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isPremium, isLoading, getPackages, purchasePackage, restorePurchases, refresh } = useSubscription();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isPremium && navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  const packages = useMemo(() => getPackages(), [getPackages]);

  const monthlyPackage = useMemo(() => {
    return packages.find((pkg) => pkg.identifier.toLowerCase().includes('monthly')) ?? null;
  }, [packages]);

  const yearlyPackage = useMemo(() => {
    return packages.find((pkg) => pkg.identifier.toLowerCase().includes('annual'))
      ?? packages.find((pkg) => pkg.identifier.toLowerCase().includes('yearly'))
      ?? null;
  }, [packages]);

  const orderedPackages = useMemo(() => {
    const items: PurchasesPackage[] = [];
    if (yearlyPackage) items.push(yearlyPackage);
    if (monthlyPackage) items.push(monthlyPackage);
    return items;
  }, [monthlyPackage, yearlyPackage]);

  const yearlySavingsLabel = useMemo(() => {
    if (!yearlyPackage || !monthlyPackage) return null;
    const monthlyPrice = monthlyPackage.product?.price;
    const yearlyPrice = yearlyPackage.product?.price;

    if (typeof monthlyPrice !== 'number' || typeof yearlyPrice !== 'number') return null;
    if (!Number.isFinite(monthlyPrice) || !Number.isFinite(yearlyPrice)) return null;
    if (monthlyPrice <= 0 || yearlyPrice <= 0) return null;

    const expectedAnnual = monthlyPrice * 12;
    if (expectedAnnual <= yearlyPrice) return null;

    const savingsPercent = Math.round(((expectedAnnual - yearlyPrice) / expectedAnnual) * 100);
    if (savingsPercent <= 0) return null;
    return `Save ${savingsPercent}%`;
  }, [monthlyPackage, yearlyPackage]);

  useEffect(() => {
    if (selectedPackageId) return;
    if (yearlyPackage) {
      setSelectedPackageId(yearlyPackage.identifier);
      return;
    }
    if (monthlyPackage) {
      setSelectedPackageId(monthlyPackage.identifier);
    }
  }, [monthlyPackage, selectedPackageId, yearlyPackage]);

  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return null;
    return packages.find((pkg) => pkg.identifier === selectedPackageId) ?? null;
  }, [packages, selectedPackageId]);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    try {
      setIsRestoring(true);
      await restorePurchases();
    } finally {
      setIsRestoring(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedPackage || isPurchasing) return;
    try {
      setIsPurchasing(true);
      const didPurchase = await purchasePackage(selectedPackage);
      if (didPurchase) {
        handleClose();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePrivacy = async () => {
    await Linking.openURL('https://recalibra.it/privacy');
  };

  return (
    <Screen style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      ) : orderedPackages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>Recalibra Pro</Text>
          <Text style={styles.subtitle}>
            Subscription options are temporarily unavailable. Please try again.
          </Text>

          <TouchableOpacity style={styles.cta} onPress={refresh} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Try again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>Restore purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handlePrivacy} activeOpacity={0.85}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Unlock Recalibra Pro</Text>
          <Text style={styles.subtitle}>
            Personalized sessions, full exercise library, and advanced tracking.
          </Text>

          <View style={styles.plans}>
            {orderedPackages.map((pkg) => {
              const isSelected = pkg.identifier === selectedPackageId;
              const price = pkg.product?.priceString ?? '';
              const isYearly = pkg === yearlyPackage;
              const label = isYearly ? 'Yearly' : 'Monthly';
              const badgeLabel = isYearly ? (yearlySavingsLabel ?? 'Best value') : null;

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelectedPackageId(pkg.identifier)}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${label} plan`}
                >
                  <View style={styles.planRow}>
                    <View style={styles.planText}>
                      <Text style={styles.planTitle}>{label}</Text>
                      <Text style={styles.planPrice}>{price}</Text>
                    </View>

                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  {isYearly && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badgeLabel}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.benefits}>
            {PREMIUM_FEATURES.slice(0, 4).map((feature) => (
              <View key={feature.title} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                <Text style={styles.benefitText}>{feature.title}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cta, (!selectedPackage || isPurchasing) && styles.ctaDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!selectedPackage || isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRestore}
            activeOpacity={0.85}
            disabled={isRestoring}
          >
            <Text style={styles.secondaryText}>{isRestoring ? 'Restoring…' : 'Restore purchases'}</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>Cancel anytime in App Store settings.</Text>

          <TouchableOpacity style={styles.linkButton} onPress={handlePrivacy} activeOpacity={0.85}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
    paddingTop: Spacing.md,
  },
  headerSpacer: {
    width: 22,
    height: 22,
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
  emptyState: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.heading,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  plans: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  planCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  planCardSelected: {
    borderColor: Colors.primary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planText: {
    gap: 4,
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  planPrice: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
  benefits: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  secondaryButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
  },
  footerText: {
    marginTop: Spacing.lg,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
});
