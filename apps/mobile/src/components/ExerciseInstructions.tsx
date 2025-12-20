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

// Exercise instruction data
export const EXERCISE_INSTRUCTIONS: Record<string, {
  title: string;
  steps: string[];
  tips: string[];
  animationType: 'breathing' | 'box' | 'pulse' | 'wave';
}> = {
  'physiological-sigh': {
    title: 'Physiological Sigh',
    animationType: 'breathing',
    steps: [
      'Take a deep breath in through your nose',
      'At the top, take a second short breath to fully expand lungs',
      'Slowly exhale through your mouth (longer than inhale)',
      'Repeat 1-3 times for immediate calm',
    ],
    tips: [
      'The double inhale is key - it opens collapsed air sacs',
      'Make the exhale at least twice as long as inhale',
      'This is the fastest way to calm your nervous system',
    ],
  },
  'box-breathing': {
    title: 'Box Breathing',
    animationType: 'box',
    steps: [
      'Inhale slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly for 4 seconds',
      'Hold empty for 4 seconds',
      'Repeat the cycle',
    ],
    tips: [
      'Used by Navy SEALs for stress control',
      'Keep equal timing for all 4 phases',
      'Focus on the corners of the "box"',
    ],
  },
  '4-7-8-breathing': {
    title: '4-7-8 Breathing',
    animationType: 'breathing',
    steps: [
      'Inhale quietly through nose for 4 seconds',
      'Hold your breath for 7 seconds',
      'Exhale completely through mouth for 8 seconds',
      'Repeat 4 times',
    ],
    tips: [
      'Created by Dr. Andrew Weil',
      'Acts as a natural tranquilizer',
      'Best done before sleep',
    ],
  },
  'cold-exposure': {
    title: 'Cold Exposure',
    animationType: 'wave',
    steps: [
      'Start with warm water as normal',
      'Gradually reduce temperature',
      'End with 30-90 seconds of cold',
      'Focus on slow, controlled breathing',
    ],
    tips: [
      'Start with just 15 seconds and build up',
      'Cold activates the vagus nerve',
      'Breathe slowly to stay calm',
    ],
  },
  'humming': {
    title: 'Humming (Bee Breath)',
    animationType: 'pulse',
    steps: [
      'Take a deep breath in through your nose',
      'Close your lips gently',
      'Exhale while making a "mmmmm" humming sound like a bee',
      'Feel the vibration in your face, head and chest',
      'Repeat 5-10 times',
    ],
    tips: [
      'The vibration stimulates the vagus nerve',
      'Try different pitches to find what feels best',
      'You can cover your ears to amplify the effect',
    ],
  },
  'bhramari': {
    title: 'Bhramari (Bee Breath)',
    animationType: 'pulse',
    steps: [
      'Sit comfortably and close your eyes',
      'Place index fingers on ear cartilage (not inside)',
      'Take a deep breath in through your nose',
      'When "Hum 🐝" appears, make a humming "mmm" sound',
      'Feel vibrations in your head and chest',
      'Repeat 5-10 rounds',
    ],
    tips: [
      'The vibration directly stimulates your vagus nerve',
      'Lower pitches create stronger vibrations',
      'Great for anxiety and before sleep',
    ],
  },
  'lions-breath': {
    title: "Lion's Breath (Simhasana)",
    animationType: 'breathing',
    steps: [
      'Sit on your heels or cross-legged',
      'Place hands on knees, spread fingers wide',
      'Take a deep breath in through your nose',
      'When "Roar 🦁" appears: open mouth wide, stick tongue out',
      'Exhale forcefully with a "HAAA" sound',
      'Repeat 5-7 times',
    ],
    tips: [
      'Really stretch your face muscles!',
      'Let go of embarrassment - this is liberating',
      'Great for releasing jaw tension and stress',
    ],
  },
  'wim-hof': {
    title: 'Wim Hof Method',
    animationType: 'wave',
    steps: [
      'Lie down in a safe, comfortable place',
      'Take 30-40 deep, powerful breaths (deep in, relaxed out)',
      'After last exhale, hold your breath (lungs empty)',
      'When "Hold Empty" appears, relax and hold as long as comfortable',
      'When you need to breathe, take one deep breath and hold 15s',
      'Repeat 3-4 rounds',
    ],
    tips: [
      'Never practice in water or while driving!',
      'Tingling and light-headedness are normal',
      'The retention gets easier with practice',
      'Optional: follow with cold shower',
    ],
  },
  'kapalbhati': {
    title: 'Kapalbhati (Skull Shining)',
    animationType: 'pulse',
    steps: [
      'Sit with spine straight, hands on knees',
      'Take a deep breath to prepare',
      'Forcefully exhale through nose, pulling belly in',
      'Let inhale happen naturally as belly relaxes',
      'Do 20-30 rapid exhales, then rest',
      'Repeat 2-3 rounds',
    ],
    tips: [
      'Focus on the exhale - inhale is passive',
      'Keep your chest and shoulders still',
      'Stop if you feel dizzy',
    ],
  },
  'alternate-nostril': {
    title: 'Alternate Nostril (Nadi Shodhana)',
    animationType: 'breathing',
    steps: [
      'Sit comfortably with spine straight',
      'Use right thumb to close right nostril',
      'Inhale slowly through left nostril',
      'Close left with ring finger, open right',
      'Exhale through right nostril',
      'Inhale through right, switch, exhale left',
      'This is one cycle. Repeat 5-10 times',
    ],
    tips: [
      'Keep breathing slow and even',
      'Balances left and right brain hemispheres',
      'Great for focus and calming anxiety',
    ],
  },
  'nadi-shodhana': {
    title: 'Nadi Shodhana (Channel Purification)',
    animationType: 'breathing',
    steps: [
      'Sit comfortably with spine straight',
      'Use right thumb to close right nostril',
      'Inhale slowly through left nostril (4 counts)',
      'Close both nostrils and hold (4 counts)',
      'Release right nostril, exhale (4 counts)',
      'Inhale right, hold, exhale left. Repeat.',
    ],
    tips: [
      'Vishnu mudra: fold index and middle fingers down',
      'Purifies the energy channels (nadis)',
      'Practice on empty stomach for best results',
    ],
  },
  'resonant-breathing': {
    title: 'Resonant Breathing (Coherent)',
    animationType: 'breathing',
    steps: [
      'Sit or lie comfortably',
      'Breathe in slowly for about 5.5 seconds',
      'Breathe out slowly for about 5.5 seconds',
      'No pauses between breaths - continuous flow',
      'Maintain this rhythm for the session',
    ],
    tips: [
      'This rate (5.5 breaths/min) optimizes heart rate variability',
      'Creates "coherence" between heart and brain',
      'Most calming breathing rate for most people',
    ],
  },
  'ujjayi': {
    title: 'Ujjayi (Ocean Breath)',
    animationType: 'breathing',
    steps: [
      'Sit comfortably with spine straight',
      'Slightly constrict the back of your throat',
      'Breathe in through nose, creating a soft hissing sound',
      'Breathe out through nose with same gentle constriction',
      'Sound should be like ocean waves or gentle snoring',
    ],
    tips: [
      'Imagine fogging a mirror with your breath',
      'Keep the sound soft, not forced',
      'Used throughout yoga practice for focus',
    ],
  },
  'ha-breath': {
    title: 'Ha Breath (Hawaiian)',
    animationType: 'breathing',
    steps: [
      'Stand or sit with feet grounded',
      'Take a deep breath in through your nose',
      'When "HA! 🌺" appears, exhale with a strong "HA!" sound',
      'Feel the energy release through your whole body',
      'Pause briefly, then repeat',
    ],
    tips: [
      '"Ha" means breath of life in Hawaiian',
      'Used in Huna tradition for clearing energy',
      'Great for releasing stuck emotions',
    ],
  },
  'tummo': {
    title: 'Tummo (Inner Fire)',
    animationType: 'wave',
    steps: [
      'Sit in meditation posture',
      'Visualize a small flame at your navel',
      'Inhale deeply, imagining breath feeding the flame',
      'Hold breath, see the flame grow brighter',
      'Exhale slowly, feeling warmth spread through body',
      'Continue, building sensation of inner heat',
    ],
    tips: [
      'Advanced Tibetan Buddhist practice',
      'Can actually raise body temperature',
      'Learn from qualified teacher for full practice',
    ],
  },
  'sitali-pranayama': {
    title: 'Sitali (Cooling Breath)',
    animationType: 'breathing',
    steps: [
      'Sit comfortably with eyes closed',
      'Roll your tongue into a tube shape',
      'If you cannot roll, purse lips instead',
      'Inhale slowly through the rolled tongue',
      'Close mouth and exhale through nose',
      'Feel the cooling sensation',
    ],
    tips: [
      'Cools the body and calms the mind',
      'Good for hot weather or anger',
      'Avoid in cold weather or with respiratory issues',
    ],
  },
  'default': {
    title: 'Exercise Instructions',
    animationType: 'breathing',
    steps: [
      'Follow the circle animation on screen',
      'Inhale when the circle expands',
      'Exhale when the circle contracts',
      'Hold when indicated',
      'Breathe slowly and deeply',
    ],
    tips: [
      'Find a quiet, comfortable place',
      'Practice regularly for best results',
      'Stop if you feel dizzy or uncomfortable',
    ],
  },
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
  
  // Get instructions from props (database) or fallback to hardcoded
  const fallbackInstructions =
    EXERCISE_INSTRUCTIONS[exerciseId] ??
    EXERCISE_INSTRUCTIONS.default ??
    ({ title: '', steps: [], tips: [] } as const);

  const steps = dbSteps ?? fallbackInstructions.steps;
  const tips = dbTips ?? fallbackInstructions.tips;
  const title = fallbackInstructions.title || exerciseName;

  return (
    <>
      <TouchableOpacity 
        style={styles.howToButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.howToText}>How to do this exercise</Text>
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

              {/* Steps */}
              <Text style={styles.sectionTitle}>Steps</Text>
              {steps.map((step: string, index: number) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              {/* Tips */}
              <Text style={styles.sectionTitle}>Tips</Text>
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
              <Text style={styles.gotItText}>Got it!</Text>
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
