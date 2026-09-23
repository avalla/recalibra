import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GuidanceMode, GuidanceSpeed } from '../types';

const KEY = '@recalibra:guided_preferences';

export interface GuidedPreferences {
  guidanceMode: GuidanceMode;
  guidanceSpeed: GuidanceSpeed;
  audioEnabled: boolean;
}

const DEFAULTS: GuidedPreferences = {
  guidanceMode: 'automatic',
  guidanceSpeed: 'normal',
  audioEnabled: true,
};

export async function loadGuidedPreferences(): Promise<GuidedPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<GuidedPreferences>;
    return {
      guidanceMode: parsed.guidanceMode === 'manual' ? 'manual' : 'automatic',
      guidanceSpeed: parsed.guidanceSpeed === 'slow' || parsed.guidanceSpeed === 'fast' ? parsed.guidanceSpeed : 'normal',
      audioEnabled: parsed.audioEnabled !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveGuidedPreferences(preferences: GuidedPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(preferences));
}
