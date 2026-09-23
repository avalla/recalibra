import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, FontWeight } from '../constants';

const CUES: Record<string, string> = {
  'eyes-up': '↑',
  'eyes-down': '↓',
  'eyes-left': '←',
  'eyes-right': '→',
  'eyes-left-right': '←  →',
  'eyes-diagonal': '↖  ↘',
  'eyes-diagonal-reverse': '↗  ↙',
  'eyes-circle': '⟳',
  'eyes-circle-reverse': '⟲',
  'eyes-closed': '◌',
  breathing: '◯',
  ready: '•',
};

export function GuidedCue({ cue, instruction }: { cue?: string; instruction: string }) {
  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={instruction}>
      <Text style={styles.cue}>{CUES[cue ?? ''] ?? '•'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
  cue: { color: Colors.primary, fontSize: 78, lineHeight: 96, fontFamily: FontFamily.heading, fontWeight: FontWeight.regular, textAlign: 'center' },
});
