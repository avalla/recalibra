import AsyncStorage from '@react-native-async-storage/async-storage';

export type BreathingVisualizationMode = 'circle' | 'graph';
export type BreathingCurvePresetOverride = 'auto' | 'default' | 'relax' | 'energy';

const BREATHING_VISUALIZATION_KEY = '@recalibra:breathing_visualization_mode';
const BREATHING_CURVE_PRESET_KEY = '@recalibra:breathing_curve_preset';

export async function loadBreathingVisualizationMode(): Promise<BreathingVisualizationMode> {
  const raw = await AsyncStorage.getItem(BREATHING_VISUALIZATION_KEY);
  if (raw === 'graph' || raw === 'circle') return raw;
  return 'circle';
}

export async function saveBreathingVisualizationMode(mode: BreathingVisualizationMode): Promise<void> {
  await AsyncStorage.setItem(BREATHING_VISUALIZATION_KEY, mode);
}

export async function loadBreathingCurvePresetOverride(): Promise<BreathingCurvePresetOverride> {
  const raw = await AsyncStorage.getItem(BREATHING_CURVE_PRESET_KEY);
  if (raw === 'auto' || raw === 'default' || raw === 'relax' || raw === 'energy') return raw;
  return 'auto';
}

export async function saveBreathingCurvePresetOverride(
  preset: BreathingCurvePresetOverride
): Promise<void> {
  await AsyncStorage.setItem(BREATHING_CURVE_PRESET_KEY, preset);
}
