import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageProvider';
import { tr } from '../i18n/core';
import type { LanguagePreference } from '../i18n/language';
import { Colors, FontSize, Spacing } from '../constants';

export function LanguageSettings() {
  const { preference, setPreference } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const options: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: tr('System default') },
    { value: 'it', label: 'Italiano' },
    { value: 'en', label: 'English' },
  ];
  const choose = async (value: LanguagePreference) => {
    setSaving(true);
    setFailed(false);
    try { await setPreference(value); } catch { setFailed(true); }
    finally { setSaving(false); }
  };
  return <View style={styles.container}>
    <Text style={styles.title} accessibilityRole="header">{tr('Language')}</Text>
    {options.map(option => <TouchableOpacity key={option.value} accessibilityRole="radio"
      accessibilityState={{ checked: preference === option.value, disabled: saving }} disabled={saving}
      style={styles.option} onPress={() => void choose(option.value)}>
      <Text style={[styles.label, preference === option.value && styles.selected]}>{option.label}</Text>
      <Text accessible={false} style={styles.selected}>{preference === option.value ? '✓' : ''}</Text>
    </TouchableOpacity>)}
    {failed && <Text accessibilityRole="alert" style={styles.error}>{tr('Could not save language. Please try again.')}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.sm },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  label: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.md },
  selected: { color: Colors.primary },
  error: { color: Colors.error, fontSize: FontSize.sm },
});
