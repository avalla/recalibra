import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { useFonts } from 'expo-font';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/contexts';
import { Colors, FontFamily } from './src/constants';
import { ErrorBoundary } from './src/components';
import { initializeRevenueCat } from './src/lib/revenuecat';
import { initDb } from './src/db';

// Disable native screens to avoid reanimated issues
enableScreens(false);

const TextWithDefaultProps = Text as unknown as { defaultProps?: { style?: unknown } };
TextWithDefaultProps.defaultProps = {
  ...(TextWithDefaultProps.defaultProps || {}),
  style: [{ fontFamily: FontFamily.regular }, TextWithDefaultProps.defaultProps?.style],
};

const TextInputWithDefaultProps = TextInput as unknown as { defaultProps?: { style?: unknown } };
TextInputWithDefaultProps.defaultProps = {
  ...(TextInputWithDefaultProps.defaultProps || {}),
  style: [{ fontFamily: FontFamily.regular }, TextInputWithDefaultProps.defaultProps?.style],
};

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.backgroundCard,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export default function App() {
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/poppins/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/poppins/Poppins-Bold.ttf'),
    'DMSerifDisplay-Regular': require('./assets/fonts/dm-serif-display/DMSerifDisplay-Regular.ttf'),
    'DMSerifDisplay-Italic': require('./assets/fonts/dm-serif-display/DMSerifDisplay-Italic.ttf'),
  });

  useEffect(() => {
    const init = async () => {
      try {
        await initDb();
        setIsDbReady(true);
        await initializeRevenueCat();
        setIsRevenueCatReady(true);
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        // Continue anyway - subscription features won't work but app will load
        setIsRevenueCatReady(true);
        setIsDbReady(true);
      }
    };
    init();
  }, []);

  if (!fontsLoaded || !isRevenueCatReady || !isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer theme={DarkTheme}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
