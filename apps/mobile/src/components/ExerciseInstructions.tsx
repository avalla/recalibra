import { tr } from '../i18n/core';
import { useLanguage } from '../i18n/LanguageProvider';
import { exerciseText } from '../i18n/exercises';
import { seedExercises } from '../data/exercises';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';

// Video assets
const EXERCISE_VIDEOS: Record<string, any> = {
  'stress-buster': require('../../assets/videos/stress-buster.mp4'),
  'box-breathing': require('../../assets/videos/box-breathing.mp4'),
  'physiological-sigh': require('../../assets/videos/physiological-sigh.mp4'),
  '4-7-8-breathing': require('../../assets/videos/4-7-8-breathing.mp4'),
  'cold-exposure': require('../../assets/videos/cold-exposure.mp4'),
  'humming': require('../../assets/videos/humming.mp4'),
};

// Video player component for exercise demonstrations
const ExerciseVideo: React.FC<{ exerciseId: string }> = ({ exerciseId }) => {
  const videoSource = EXERCISE_VIDEOS[exerciseId] || EXERCISE_VIDEOS['stress-buster'];
  
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={videoStyles.video}
      contentFit="contain"
      nativeControls={false}
    />
  );
};

const videoStyles = StyleSheet.create({
  video: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
});

interface ExerciseInstructionsProps {
  exerciseId: string;
  exerciseName: string;
  // Optional props to pass data from database
  steps?: string[];
  tips?: string[];
}

export const ExerciseInstructions: React.FC<ExerciseInstructionsProps> = ({
  exerciseId,
  exerciseName,
  steps: dbSteps,
  tips: dbTips,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const { language } = useLanguage();
  const canonical = seedExercises.find(exercise => exercise.id === exerciseId || exercise.slug === exerciseId);
  const text = exerciseText(canonical?.id ?? exerciseId, {
    name: exerciseName,
    instructions: dbSteps?.map((instruction, index) => ({ step: index + 1, instruction })),
    tips: dbTips,
  }, language);
  const steps = text.instructions?.map(step => step.instruction) ?? [tr('Read the exercise instructions before starting.')];
  const tips = text.tips ?? [];
  const title = text.name ?? exerciseName;

  return (
    <>
      <TouchableOpacity 
        style={styles.howToButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.howToText}>{tr('How to do this exercise')}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Animation */}
              <View style={styles.animationContainer}>
                <ExerciseVideo exerciseId={exerciseId} />
              </View>

              {text.safety_warning ? <Text style={styles.stepText}>{text.safety_warning}</Text> : null}
              {/* Steps */}
              <Text style={styles.sectionTitle}>{tr('Steps')}</Text>
              {steps.map((step: string, index: number) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              {/* Tips */}
              <Text style={styles.sectionTitle}>{tr('Tips')}</Text>
              {tips.map((tip: string, index: number) => (
                <View key={index} style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Got it button */}
            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.gotItText}>{tr('Got it!')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  howToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  howToText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  animationContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  animation: {
    width: 150,
    height: 150,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  stepText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  gotItButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  gotItText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
