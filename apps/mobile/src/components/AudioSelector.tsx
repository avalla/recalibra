import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
    type: 'frequency',
    icon: 'pulse-outline',
  },
  {
    id: 'binaural_theta',
    name: 'Theta Waves',
    description: 'Deep meditation (6 Hz)',
    type: 'frequency',
    icon: 'pulse-outline',
  },
  {
    id: 'solfeggio_432',
    name: '432 Hz',
    description: 'Harmony frequency',
    type: 'frequency',
    icon: 'radio-outline',
  },
  {
    id: 'solfeggio_528',
    name: '528 Hz',
    description: 'Transformation frequency',
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
    type: 'tibetan',
    icon: 'ellipse-outline',
  },
  {
    id: 'tibetan_bells',
    name: 'Tibetan Bells',
    description: 'Crystal bell tones',
    type: 'tibetan',
    icon: 'notifications-outline',
  },
  // Nature sounds
  {
    id: 'nature_rain',
    name: 'Rain',
    description: 'Gentle rain sounds',
    type: 'nature',
    icon: 'rainy-outline',
  },
  {
    id: 'nature_ocean',
    name: 'Ocean',
    description: 'Calming ocean waves',
    type: 'nature',
    icon: 'water-outline',
  },
  {
    id: 'nature_forest',
    name: 'Forest',
    description: 'Birds and gentle wind',
    type: 'nature',
    icon: 'leaf-outline',
  },
  {
    id: 'wind',
    name: 'Wind',
    description: 'Soft wind sounds',
    type: 'nature',
    icon: 'cloudy-outline',
  },
  {
    id: 'creek',
    name: 'Creek',
    description: 'Flowing water',
    type: 'nature',
    icon: 'water-outline',
  },
];

interface AudioSelectorProps {
  selectedAudioId: string;
  onSelect: (audioId: string) => void;
  recommendedId?: string;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  selectedAudioId,
  onSelect,
  recommendedId,
}) => {
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
      <Text style={styles.title}>Audio</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
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

      {/* Options - scrollable */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsScroll}
        style={styles.optionsScrollView}
      >
        {filteredOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionPill,
              selectedAudioId === option.id && styles.optionPillActive,
              recommendedId === option.id && selectedAudioId !== option.id && styles.optionPillRecommended,
            ]}
            onPress={() => onSelect(option.id)}
          >
            {recommendedId === option.id && (
              <Ionicons
                name="sparkles"
                size={12}
                color={selectedAudioId === option.id ? Colors.background : Colors.primary}
              />
            )}
            <Ionicons
              name={option.icon}
              size={16}
              color={selectedAudioId === option.id ? Colors.background : Colors.primary}
            />
            <Text
              style={[
                styles.optionPillText,
                selectedAudioId === option.id && styles.optionPillTextActive,
              ]}
              numberOfLines={1}
            >
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Benefits info box */}
      {selectedAudioId && selectedAudioId !== 'silence' && (
        <View style={[
          styles.benefitsBox,
          recommendedId === selectedAudioId && styles.benefitsBoxRecommended,
        ]}>
          <View style={styles.benefitsHeader}>
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.benefitsTitle}>
              {(AUDIO_PRESETS as any)[selectedAudioId]?.name || 'Info'}
            </Text>
            {recommendedId === selectedAudioId && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="sparkles" size={10} color={Colors.background} />
                <Text style={styles.recommendedBadgeText}>Recommended</Text>
              </View>
            )}
            {/* Preview Button */}
            <TouchableOpacity 
              style={[styles.previewButton, isPreviewPlaying && styles.previewButtonActive]}
              onPress={handlePreviewToggle}
            >
              <Ionicons 
                name={isPreviewPlaying ? 'pause' : 'play'} 
                size={14} 
                color={isPreviewPlaying ? Colors.background : Colors.primary} 
              />
              <Text style={[styles.previewButtonText, isPreviewPlaying && styles.previewButtonTextActive]}>
                {isPreviewPlaying ? 'Stop' : 'Preview'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.benefitsText}>
            {(AUDIO_PRESETS as any)[selectedAudioId]?.benefits || 
             (AUDIO_PRESETS as any)[selectedAudioId]?.description || 
             'Select an audio option to see its benefits.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.background,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
  optionPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionPillRecommended: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  optionPillText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  optionPillTextActive: {
    color: Colors.background,
  },
  optionsScrollView: {
    maxHeight: 50,
  },
  optionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 44,
  },
  benefitsBox: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
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
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  recommendedBadgeText: {
    color: Colors.background,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginLeft: 'auto',
  },
  previewButtonActive: {
    backgroundColor: Colors.primary,
  },
  previewButtonText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  previewButtonTextActive: {
    color: Colors.background,
  },
});
