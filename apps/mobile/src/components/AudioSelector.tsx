import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';
import { AUDIO_PRESETS, useAudio } from '../hooks/useAudio';
import type { AudioPresetKey } from '../hooks/useAudio';
import { useSubscription } from '../hooks/useSubscription';

export type AudioType = 'silence' | 'frequency' | 'nature' | 'tibetan';

export interface AudioOption {
  id: AudioPresetKey;
  name: string;
  description: string;
  details?: string;
  type: AudioType;
  icon: keyof typeof Ionicons.glyphMap;
}

const AUDIO_OPTION_META: Record<
  AudioPresetKey,
  { type: AudioType; icon: keyof typeof Ionicons.glyphMap; order: number }
> = {
  silence: { type: 'silence', icon: 'volume-mute-outline', order: 0 },

  binaural_alpha: { type: 'frequency', icon: 'pulse-outline', order: 100 },
  binaural_theta: { type: 'frequency', icon: 'pulse-outline', order: 110 },
  binaural_delta: { type: 'frequency', icon: 'pulse-outline', order: 120 },

  schumann: { type: 'frequency', icon: 'globe-outline', order: 200 },
  om: { type: 'frequency', icon: 'infinite-outline', order: 210 },

  solfeggio_396: { type: 'frequency', icon: 'radio-outline', order: 300 },
  solfeggio_432: { type: 'frequency', icon: 'radio-outline', order: 310 },
  solfeggio_528: { type: 'frequency', icon: 'radio-outline', order: 320 },
  solfeggio_639: { type: 'frequency', icon: 'radio-outline', order: 330 },
  solfeggio_741: { type: 'frequency', icon: 'radio-outline', order: 340 },
  solfeggio_852: { type: 'frequency', icon: 'radio-outline', order: 350 },

  tibetan_bowl: { type: 'tibetan', icon: 'ellipse-outline', order: 400 },
  tibetan_bells: { type: 'tibetan', icon: 'notifications-outline', order: 410 },

  nature_rain: { type: 'nature', icon: 'rainy-outline', order: 500 },
  nature_ocean: { type: 'nature', icon: 'water-outline', order: 510 },
  nature_forest: { type: 'nature', icon: 'leaf-outline', order: 520 },
  wind: { type: 'nature', icon: 'cloudy-outline', order: 530 },
  creek: { type: 'nature', icon: 'water-outline', order: 540 },
};

export const AUDIO_OPTIONS: AudioOption[] = (Object.keys(AUDIO_PRESETS) as AudioPresetKey[])
  .map((presetKey) => {
    const preset = AUDIO_PRESETS[presetKey];
    const meta = AUDIO_OPTION_META[presetKey];

    return {
      id: presetKey,
      name: preset.name,
      description: preset.description,
      details: preset.benefits,
      type: meta.type,
      icon: meta.icon,
    };
  })
  .sort((a, b) => AUDIO_OPTION_META[a.id].order - AUDIO_OPTION_META[b.id].order);

interface AudioSelectorProps {
  selectedAudioId: AudioPresetKey;
  onSelect: (audioId: AudioPresetKey) => void;
  recommendedId?: AudioPresetKey;
  showPreviewButton?: boolean;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  selectedAudioId,
  onSelect,
  recommendedId,
  showPreviewButton = true,
}) => {
  const { canAccessAudio, presentPaywall, isPremium } = useSubscription();

  useEffect(() => {
    if (isPremium) return;
    if (canAccessAudio(selectedAudioId)) return;
    onSelect('silence');
  }, [canAccessAudio, isPremium, onSelect, selectedAudioId]);

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
  const [previewAudioId, setPreviewAudioId] = useState<AudioPresetKey>(selectedAudioId);
  const [shouldAutoPlayPreview, setShouldAutoPlayPreview] = useState(false);
  const [isBinauralInfoOpen, setIsBinauralInfoOpen] = useState(false);
  const [isBinauralDetailsOpen, setIsBinauralDetailsOpen] = useState(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeBinauralInfo = () => {
    setIsBinauralInfoOpen(false);
    setIsBinauralDetailsOpen(false);
  };

  const isSelectedBinaural = useMemo(() => {
    return selectedAudioId.startsWith('binaural_');
  }, [selectedAudioId]);
  
  // Audio preview hook - uses previewAudioId to force re-creation
  const { play: playPreview, stop: stopPreview, isLoaded } = useAudio({
    preset: previewAudioId,
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

  useEffect(() => {
    if (!shouldAutoPlayPreview) return;
    if (!isLoaded) return;

    playPreview();
    setIsPreviewPlaying(true);
    setShouldAutoPlayPreview(false);

    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    previewTimeoutRef.current = setTimeout(() => {
      stopPreview();
      setIsPreviewPlaying(false);
      previewTimeoutRef.current = null;
    }, 5000);
  }, [isLoaded, playPreview, shouldAutoPlayPreview, stopPreview]);

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

  const filteredOptions = useMemo(
    () => AUDIO_OPTIONS.filter((o) => o.type === activeTab),
    [activeTab]
  );

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

      {isSelectedBinaural && (
        <TouchableOpacity
          style={styles.binauralNotice}
          onPress={() => {
            setIsBinauralDetailsOpen(false);
            setIsBinauralInfoOpen(true);
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="headset-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.binauralNoticeText}>
            For binaural effect, use stereo headphones. On speaker, the effect may be reduced.
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      <Modal
        visible={isBinauralInfoOpen}
        transparent
        animationType="slide"
        onRequestClose={closeBinauralInfo}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={closeBinauralInfo}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <Ionicons name="headset-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.sheetTitle}>Binaural beats</Text>
            </View>
            <TouchableOpacity
              onPress={closeBinauralInfo}
              style={styles.sheetCloseButton}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <Text style={styles.sheetText}>
              Binaural beats use a slightly different tone in each ear. The brain can perceive the difference as a slow
              “beat”.
            </Text>
            <Text style={styles.sheetText}>
              To work properly, the audio must stay separated between left and right. With phone speakers or mono output,
              channels can mix and the effect may be reduced.
            </Text>

            <TouchableOpacity
              style={styles.sheetSecondaryButton}
              onPress={() => setIsBinauralDetailsOpen((prev) => !prev)}
              activeOpacity={0.9}
            >
              <Text style={styles.sheetSecondaryButtonText}>
                {isBinauralDetailsOpen ? 'Show less' : 'I want more details'}
              </Text>
              <Ionicons
                name={isBinauralDetailsOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.primary}
              />
            </TouchableOpacity>

            {isBinauralDetailsOpen && (
              <View style={styles.sheetDetails}>
                <Text style={styles.sheetText}>
                  Example: 200 Hz in the left ear and 210 Hz in the right ear can feel like a 10 Hz beat. This “beat” is
                  not a separate audio tone, but a perception created by the brain.
                </Text>
                <Text style={styles.sheetText}>
                  Headphones are recommended because they keep left and right channels isolated. With speakers, both ears
                  hear both channels and the effect becomes less reliable.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.sheetPrimaryButton}
            onPress={closeBinauralInfo}
            activeOpacity={0.9}
          >
            <Text style={styles.sheetPrimaryButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Options */}
      <View style={styles.optionsList}>
        {filteredOptions.map((option) => {
          const isSelected = option.id === selectedAudioId;
          const isRecommended = option.id === recommendedId;
          const isPreviewingThis = isPreviewPlaying && previewAudioId === option.id;
          const isBinauralOption = option.id.startsWith('binaural_');
          const isLocked = !isPremium && !canAccessAudio(option.id);

          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardActive,
                isLocked && styles.optionCardLocked,
                pressed && styles.optionCardPressed,
              ]}
              onPress={async () => {
                animateNextLayout();
                if (!isLocked) {
                  onSelect(option.id);
                  return;
                }

                const didPurchase = await presentPaywall();
                if (didPurchase) onSelect(option.id);
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
                      {isLocked && (
                        <View style={styles.proBadge}>
                          <Ionicons name="lock-closed" size={12} color={Colors.warning} />
                          <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                      )}
                      {isBinauralOption && (
                        <View style={[styles.headphonesBadge, isSelected && styles.headphonesBadgeActive]}>
                          <Ionicons
                            name="headset-outline"
                            size={12}
                            color={isSelected ? Colors.background : Colors.textSecondary}
                          />
                        </View>
                      )}
                      {isRecommended && (
                        <View style={[styles.recommendedBadge, isSelected && styles.recommendedBadgeActive]}>
                          <Ionicons
                            name={isSelected ? 'star' : 'star-outline'}
                            size={12}
                            color={isSelected ? Colors.background : Colors.primary}
                          />
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
                          if (isLocked) {
                            const didPurchase = await presentPaywall();
                            if (!didPurchase) return;
                          }
                          if (previewTimeoutRef.current) {
                            clearTimeout(previewTimeoutRef.current);
                            previewTimeoutRef.current = null;
                          }

                          if (isPreviewPlaying && previewAudioId === option.id) {
                            await stopPreview();
                            setIsPreviewPlaying(false);
                            return;
                          }

                          if (isPreviewPlaying) {
                            await stopPreview();
                            setIsPreviewPlaying(false);
                          }

                          setPreviewAudioId(option.id);
                          setShouldAutoPlayPreview(true);
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
  binauralNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    marginBottom: Spacing.sm,
  },
  binauralNoticeText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.backgroundElevated,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sheetCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  sheetBody: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  sheetPrimaryButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  sheetPrimaryButtonText: {
    color: Colors.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sheetSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.35)',
  },
  sheetSecondaryButtonText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  sheetDetails: {
    gap: Spacing.sm,
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
  optionCardLocked: {
    opacity: 0.75,
    borderColor: 'rgba(245, 158, 11, 0.35)',
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
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  proBadgeText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
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
    paddingHorizontal: 8,
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
  headphonesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  headphonesBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  headphonesBadgeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  headphonesBadgeTextActive: {
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
