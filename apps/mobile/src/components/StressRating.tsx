import { tr } from '../i18n/core';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../constants';
import { STRESS_OPTIONS } from '../utils/stress-rating';

interface StressRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StressRating({ value, onChange, disabled = false }: StressRatingProps) {
  return (
    <View style={styles.options}>
      <Text style={styles.hint}>{tr("Stress level: 1 is low, 10 is very high. Choose one.")}</Text>
      {STRESS_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={tr("{{label}} stress, {{value}} out of 10. {{description}}", { label: tr(option.label), value: option.value, description: tr(option.description) })}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.option, selected && styles.selected, (pressed || disabled) && styles.dimmed]}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
            <View style={styles.text}>
              <Text style={styles.label}>{tr(option.label)} · {option.value}/10</Text>
              <Text style={styles.description}>{tr(option.description)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.sm, marginBottom: Spacing.lg },
  hint: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xs },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    minHeight: 48, padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
  },
  selected: { borderColor: Colors.primary, backgroundColor: Colors.backgroundElevated },
  dimmed: { opacity: 0.6 },
  text: { flex: 1, flexShrink: 1 },
  label: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.xs },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textSecondary, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
