import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ScreeningNavigator } from './ScreeningNavigator';
import { PaywallScreen } from '../screens/subscription';
import { useAuth } from '../contexts';
import { Colors } from '../constants';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, isLoading, userMetadata } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Check if onboarding is completed
  const onboardingCompleted = userMetadata?.onboarding_completed === true;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!session ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !onboardingCompleted ? (
        <Stack.Screen name="Screening" component={ScreeningNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="Paywall" 
            component={PaywallScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      )}
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
