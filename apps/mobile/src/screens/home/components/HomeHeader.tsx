import { useLanguage } from '../../../i18n/LanguageProvider';
import { tr } from '../../../i18n/core';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../constants';
import { BrandMark } from '../../../components';

interface HomeHeaderProps {
  onQuickStartPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onQuickStartPress }) => {
  useLanguage();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <BrandMark size={26} />
        <Text style={styles.headerTitle}>{tr("Recalibra")}</Text>
      </View>
      <TouchableOpacity onPress={onQuickStartPress} style={styles.quickStartButton} activeOpacity={0.7}>
        <Ionicons name="flash" size={16} color={Colors.primary} style={styles.quickStartIcon} />
        <Text style={styles.quickStartText}>{tr("Quick Start")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.heading,
  },
  quickStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStartIcon: {
    marginRight: 6,
  },
  quickStartText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
