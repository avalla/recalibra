import { useLanguage } from '../../../i18n/LanguageProvider';
import { tr } from '../../../i18n/core';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../constants';

interface GreetingCardProps {
  userName: string;
  greetingPhrase: string;
}

export const GreetingCard: React.FC<GreetingCardProps> = ({ userName, greetingPhrase }) => {
  useLanguage();
  const Gradient = LinearGradient as unknown as React.ComponentType<any>;

  return (
    <Gradient
      colors={[Colors.primary + '20', Colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.greetingGradient}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>{userName ? tr("Hi {{name}},", { name: userName }) : tr("Hi")}</Text>
        <Text style={styles.greetingSubtitle}>{tr(greetingPhrase)}</Text>
      </View>
    </Gradient>
  );
};

const styles = StyleSheet.create({
  greeting: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  greetingGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: 0,
  },
  greetingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    fontFamily: FontFamily.heading,
  },
  greetingSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
});
