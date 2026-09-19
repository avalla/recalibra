import { LanguageProvider } from './src/i18n/LanguageProvider';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { useFonts } from 'expo-font';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/contexts';
import { Colors } from './src/constants';
import { ErrorBoundary } from './src/components';
import { applyDefaultTextProps } from './src/app/default-text-props';
import { initializeApp } from './src/app/init';
import { DarkTheme } from './src/app/theme';

// Disable native screens to avoid reanimated issues
enableScreens(false);

applyDefaultTextProps();

export default function App() {
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
        await initializeApp();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsDbReady(true);
      }
    };
    init();
  }, []);

  if (!fontsLoaded || !isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <LanguageProvider>
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
    </LanguageProvider>
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
