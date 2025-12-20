import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';

const { width } = Dimensions.get('window');

interface Mood {
  id: string;
  emoji: string;
  label: string;
  gradient: string[];
  exerciseCategory: string;
  quickDescription: string;
}

const MOODS: Mood[] = [
  {
    id: 'stressed',
    emoji: '😰',
    label: 'Stressed',
    gradient: ['#667EEA', '#764BA2'],
    exerciseCategory: 'breathing',
    quickDescription: 'Calm your mind in 3 minutes',
  },
  {
    id: 'tired',
    emoji: '😴',
    label: 'Tired',
    gradient: ['#4FACFE', '#00F2FE'],
    exerciseCategory: 'breathing',
    quickDescription: 'Boost your energy naturally',
  },
  {
    id: 'anxious',
    emoji: '😟',
    label: 'Anxious',
    gradient: ['#43E97B', '#38F9D7'],
    exerciseCategory: 'breathing',
    quickDescription: 'Find your center now',
  },
  {
    id: 'focused',
    emoji: '🎯',
    label: 'Need Focus',
    gradient: ['#FA709A', '#FEE140'],
    exerciseCategory: 'breathing',
    quickDescription: 'Sharpen your concentration',
  },
  {
    id: 'sleepy',
    emoji: '😪',
    label: 'Can\'t Sleep',
    gradient: ['#30CFD0', '#330867'],
    exerciseCategory: 'meditation',
    quickDescription: 'Drift off peacefully',
  },
  {
    id: 'happy',
    emoji: '😊',
    label: 'Already Good',
    gradient: ['#FF6B6B', '#FFE66D'],
    exerciseCategory: 'movement',
    quickDescription: 'Enhance your positivity',
  },
];

interface MoodSelectorProps {
  onMoodSelect: (mood: Mood) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ onMoodSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Choose an exercise that matches your mood</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodContainer}
      >
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={styles.moodCard}
            onPress={() => onMoodSelect(mood)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={mood.gradient as any}
              style={styles.moodGradient}
            />
            <View style={styles.moodContent}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
              <Text style={styles.moodDescription}>{mood.quickDescription}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  moodContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  moodCard: {
    width: width * 0.35,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  moodGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  moodContent: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  moodLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  moodDescription: {
    fontSize: FontSize.xs,
    color: Colors.background + 'CC',
    textAlign: 'center',
    lineHeight: 16,
  },
});
