import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';
import { AUDIO_PRESETS, useAudio } from '../hooks/useAudio';
import type { AudioPresetKey } from '../hooks/useAudio';

export type AudioType = 'silence' | 'frequency' | 'nature' | 'tibetan';

export interface AudioOption {
  id: string;
  name: string;
  description: string;
  details?: string;
  type: AudioType;
  icon: keyof typeof Ionicons.glyphMap;
}

export const AUDIO_OPTIONS: AudioOption[] = [
  // Silence
  {
    id: 'silence',
    name: 'Silence',
    description: 'Focus on your breath without audio',
    type: 'silence',
    icon: 'volume-mute-outline',
  },
  // Frequencies
  {
    id: 'binaural_alpha',
    name: 'Alpha Waves',
    description: 'Relaxation (10 Hz)',
    details: 'Alpha waves (8–12 Hz) are associated with a calm, relaxed, yet alert state. Often used to reduce stress and support focus without drowsiness.',
    type: 'frequency',
    icon: 'pulse-outline',
  },
  {
    id: 'binaural_theta',
    name: 'Theta Waves',
    description: 'Deep meditation (6 Hz)',
    details:
      'Theta waves (4–8 Hz) are associated with deep meditation, creativity, and REM sleep. They can help access subconscious insights and encourage deep relaxation.',
    type: 'frequency',
    icon: 'pulse-outline',
  },
  {
    id: 'solfeggio_432',
    name: '432 Hz',
    description: 'Harmony frequency',
    details: '432 Hz is often described as a “natural tuning” frequency. Many people find it soothing and grounding, supporting a relaxed listening experience.',
    type: 'frequency',
    icon: 'radio-outline',
  },
  {
    id: 'solfeggio_528',
    name: '528 Hz',
    description: 'Transformation frequency',
    details: '528 Hz is popularly associated with positive mood and emotional balance. Use it when you want an uplifting, centered background tone.',
    type: 'frequency',
    icon: 'radio-outline',
  },
  {
    id: 'om',
    name: 'OM (136.1 Hz)',
    description: 'Cosmic vibration',
    type: 'frequency',
    icon: 'infinite-outline',
  },
  // More frequencies
  {
    id: 'solfeggio_741',
    name: '741 Hz',
    description: 'Awakening intuition',
    type: 'frequency',
    icon: 'radio-outline',
  },
  {
    id: 'schumann',
    name: 'Schumann 7.83 Hz',
    description: 'Earth frequency',
    type: 'frequency',
    icon: 'globe-outline',
  },
  // Tibetan instruments
  {
    id: 'tibetan_bowl',
    name: 'Singing Bowl',
    description: 'Deep healing tones',
    details:
      "Tibetan singing bowls produce rich, harmonic overtones often used for relaxation and meditation. Many people find them grounding and helpful for settling the nervous system.",
    type: 'tibetan',
    icon: 'ellipse-outline',
  },
  {
    id: 'tibetan_bells',
    name: 'Tibetan Bells',
    description: 'Crystal bell tones',
    details:
      'Bright, shimmering bell tones that can feel clarifying and uplifting. Useful when you want a lighter, more spacious background sound.',
    type: 'tibetan',
    icon: 'notifications-outline',
  },
  // Nature sounds
  {
    id: 'nature_rain',
    name: 'Rain',
    description: 'Gentle rain sounds',
    details: 'Soft rain noise can mask distractions and promote a calm, steady rhythm—often used for focus and relaxation.',
    type: 'nature',
    icon: 'rainy-outline',
  },
  {
    id: 'nature_ocean',
    name: 'Ocean',
    description: 'Calming ocean waves',
    details: 'Slow, repetitive wave patterns can feel soothing and stabilizing, helping you settle into a relaxed breathing cadence.',
    type: 'nature',
    icon: 'water-outline',
  },
  {
    id: 'nature_forest',
    name: 'Forest',
    description: 'Birds and gentle wind',
    details: 'Ambient forest soundscapes can feel restorative and spacious—helpful for unwinding and reducing perceived stress.',
    type: 'nature',
    icon: 'leaf-outline',
  },
  {
    id: 'wind',
    name: 'Wind',
    description: 'Soft wind sounds',
    details: 'A light, airy sound bed that can feel cleansing and quiet—useful when you want something subtle and non-intrusive.',
    type: 'nature',
    icon: 'cloudy-outline',
  },
  {
    id: 'creek',
    name: 'Creek',
    description: 'Flowing water',
    details: 'Flowing water provides a gentle, continuous texture that many people find grounding and calming.',
    type: 'nature',
    icon: 'water-outline',
  },
];

interface AudioSelectorProps {
  selectedAudioId: string;
  onSelect: (audioId: string) => void;
  recommendedId?: string;
  showPreviewButton?: boolean;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  selectedAudioId,
  onSelect,
  recommendedId,
  showPreviewButton = true,
}) => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!UIManager.setLayoutAnimationEnabledExperimental) return;
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  const animateNextLayout = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        180,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  };

  const [activeTab, setActiveTab] = useState<AudioType>(
    AUDIO_OPTIONS.find((o) => o.id === selectedAudioId)?.type || 'silence'
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewAudioId, setPreviewAudioId] = useState<string>(selectedAudioId);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio preview hook - uses previewAudioId to force re-creation
  const { play: playPreview, stop: stopPreview, isLoaded } = useAudio({
    preset: previewAudioId as AudioPresetKey,
    volume: 0.5,
  });

  // Stop preview and cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      stopPreview();
    };
  }, []);

  // Update preview audio ID when selection changes
  useEffect(() => {
    if (isPreviewPlaying) {
      stopPreview();
      setIsPreviewPlaying(false);
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    }
    setPreviewAudioId(selectedAudioId);
  }, [selectedAudioId]);

  const handlePreviewToggle = async () => {
    if (isPreviewPlaying) {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      await stopPreview();
      setIsPreviewPlaying(false);
    } else {
      // Ensure we have the latest audio loaded
      if (!isLoaded) {
        console.log('[AudioSelector] Audio not loaded yet');
        return;
      }
      await playPreview();
      setIsPreviewPlaying(true);
      // Auto-stop after 5 seconds
      previewTimeoutRef.current = setTimeout(async () => {
        await stopPreview();
        setIsPreviewPlaying(false);
        previewTimeoutRef.current = null;
      }, 5000);
    }
  };

  // Sync active tab when selectedAudioId changes (e.g., from recommendation)
  useEffect(() => {
    const selectedOption = AUDIO_OPTIONS.find((o) => o.id === selectedAudioId);
    if (selectedOption && selectedOption.type !== activeTab) {
      setActiveTab(selectedOption.type);
    }
  }, [selectedAudioId]);

  const tabs: { id: AudioType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'silence', label: 'Off', icon: 'volume-mute-outline' },
    { id: 'frequency', label: 'Tones', icon: 'pulse-outline' },
    { id: 'tibetan', label: 'Tibetan', icon: 'ellipse-outline' },
    { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  ];

  const filteredOptions = AUDIO_OPTIONS.filter((o) => o.type === activeTab);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              animateNextLayout();
              setActiveTab(tab.id);
              if (tab.id === 'silence' && selectedAudioId !== 'silence') {
                onSelect('silence');
              }
            }}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? Colors.background : Colors.textMuted}
            />
            <Text
              style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Options */}
      <View style={styles.optionsList}>
        {filteredOptions.map((option) => {
          const isSelected = option.id === selectedAudioId;
          const isRecommended = option.id === recommendedId;
          const isPreviewingThis = isPreviewPlaying && previewAudioId === option.id;

          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardActive,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => {
                animateNextLayout();
                onSelect(option.id);
              }}
              hitSlop={10}
            >
              <View style={styles.optionTopRow}>
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIconWrap, isSelected && styles.optionIconWrapActive]}>
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={isSelected ? Colors.background : Colors.primary}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <View style={styles.optionTitleRow}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                        {option.name}
                      </Text>
                      {isRecommended && (
                        <View style={[styles.recommendedBadge, isSelected && styles.recommendedBadgeActive]}>
                          <Text style={[styles.recommendedBadgeText, isSelected && styles.recommendedBadgeTextActive]}>
                            Recommended
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.optionSubtitle, isSelected && styles.optionSubtitleActive]}
                      numberOfLines={1}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
              </View>

              {isSelected && (option.details || (showPreviewButton && option.id !== 'silence')) && (
                <View style={styles.optionExpanded}>
                  {!!option.details && (
                    <Text style={[styles.optionDetails, isSelected && styles.optionDetailsActive]}>
                      {option.details}
                    </Text>
                  )}

                  {showPreviewButton && option.id !== 'silence' && (
                    <View style={styles.previewRow}>
                      <TouchableOpacity
                        style={[styles.previewButton, isPreviewingThis && styles.previewButtonActive]}
                        onPress={async () => {
                          animateNextLayout();
                          setPreviewAudioId(option.id);
                          await handlePreviewToggle();
                        }}
                      >
                        <Ionicons
                          name={isPreviewingThis ? 'pause' : 'play'}
                          size={12}
                          color={isPreviewingThis ? Colors.background : Colors.primary}
                        />
                        <Text
                          style={[styles.previewButtonText, isPreviewingThis && styles.previewButtonTextActive]}
                        >
                          {isPreviewingThis ? 'Stop' : 'Preview'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.background,
  },
  optionsList: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionExpanded: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.md,
  },
  optionDetails: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  optionDetailsActive: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  optionCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardPressed: {
    opacity: 0.92,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
  },
  optionCardRecommended: {
    borderColor: Colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
  },
  optionIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  optionTitleActive: {
    color: Colors.textPrimary,
  },
  optionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  optionSubtitleActive: {
    color: Colors.textSecondary,
  },
  benefitsBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  benefitsTitle: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  benefitsText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  benefitsBoxRecommended: {
    borderLeftColor: Colors.success,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.35)',
  },
  recommendedBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  recommendedBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  recommendedBadgeTextActive: {
    color: Colors.background,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  previewButtonActive: {
    backgroundColor: Colors.primary,
  },
  previewButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  previewButtonTextActive: {
    color: Colors.background,
  },
});
