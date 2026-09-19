import { useLanguage } from '../../i18n/LanguageProvider';
import { tr } from '../../i18n/core';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { GradientButton, Screen } from '../../components';
import type { RootStackScreenProps } from '../../types';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'leaf-outline',
    title: 'Welcome to Recalibra',
    description: '5 minutes a day to recalibrate your nervous system.',
  },
  {
    id: '2',
    icon: 'pulse-outline',
    title: 'Track Your Progress',
    description: 'Check in before and after, and watch your stress trend ease over time.',
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    title: 'Picked For How You Feel',
    description: 'Breathing, cold, vocal, and movement exercises matched to your state.',
  },
];

export const OnboardingScreen: React.FC = () => {
  useLanguage();
  const rootNavigation = useNavigation<RootStackScreenProps<'Onboarding'>['navigation']>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const goToScreening = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    rootNavigation.navigate('Screening', { screen: 'ScreeningExperience' });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      goToScreening();
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={120} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{tr(item.title)}</Text>
      <Text style={styles.description}>{tr(item.description)}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <Screen style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={goToScreening}
        accessibilityRole="button"
        accessibilityLabel={tr("Skip introduction")}
      >
        <Text style={styles.skipText}>{tr("Skip")}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.footer}>
        <GradientButton
          label={isCompleting ? tr("Loading...") : (currentIndex === slides.length - 1 ? tr("Get Started") : tr("Next"))}
          onPress={handleNext}
          disabled={isCompleting}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.lg,
    zIndex: 1,
  },
  skipText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
});
