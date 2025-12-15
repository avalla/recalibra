import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/contexts';
import { Colors } from './src/constants';
import { ErrorBoundary } from './src/components';
import { initializeRevenueCat } from './src/lib/revenuecat';

// Disable native screens to avoid reanimated issues
enableScreens(false);

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

  useEffect(() => {
    const init = async () => {
      try {
        await initializeRevenueCat();
        setIsRevenueCatReady(true);
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        // Continue anyway - subscription features won't work but app will load
        setIsRevenueCatReady(true);
      }
    };
    init();
  }, []);

  if (!isRevenueCatReady) {
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
