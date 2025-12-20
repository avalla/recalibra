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
import { useAuth } from '../../contexts';

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
    description: 'Monitor your stress levels and HRV to see real improvements.',
  },
  {
    id: '3',
    icon: 'sparkles-outline',
    title: 'Personalized Sessions',
    description: 'AI-powered exercises tailored to your needs and goals.',
  },
];

export const OnboardingScreen: React.FC = () => {
  const rootNavigation = useNavigation<any>();
  const { completeOnboarding } = useAuth();
  const { isAnonymous, isLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSkip = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    console.log('🔍 Skip button pressed');
    try {
      await completeOnboarding();
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      if (isCompleting) return;
      
      setIsCompleting(true);
      console.log('🔍 Get Started button pressed');
      try {
        await completeOnboarding();
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={120} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
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
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
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
          label={isCompleting ? 'Loading...' : (currentIndex === slides.length - 1 ? 'Get Started' : 'Next')}
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
    top: 60,
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
