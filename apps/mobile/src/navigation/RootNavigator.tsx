import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { ScreeningNavigator } from './ScreeningNavigator';
import { PaywallScreen } from '../screens/subscription';
import { AccountUpgradeScreen } from '../screens/auth';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { QuickStartPreferencesScreen } from '../screens/settings';
import { useAuth } from '../contexts';
import { Colors } from '../constants';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isLoading, onboardingCompleted } = useAuth();
  
  console.log('🔍 RootNavigator render:', { 
    onboardingCompleted,
    shouldShowOnboarding: !onboardingCompleted,
    shouldShowMain: onboardingCompleted,
  });
  
  // Additional log to track state changes
  React.useEffect(() => {
    console.log('🔍 RootNavigator useEffect - onboardingCompleted changed to:', onboardingCompleted);
  }, [onboardingCompleted]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Check if onboarding is completed - now using local state
  // const onboardingCompleted = userMetadata?.onboarding_completed === true;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!onboardingCompleted ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}

      <Stack.Screen name="Screening" component={ScreeningNavigator} />
      <Stack.Screen 
        name="Paywall" 
        component={PaywallScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="AccountUpgrade" 
        component={AccountUpgradeScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="QuickStartPreferences"
        component={QuickStartPreferencesScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
