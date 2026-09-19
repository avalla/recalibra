import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { ScreeningNavigator } from './ScreeningNavigator';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { QuickStartPreferencesScreen } from '../screens/settings';
import { ExerciseDetailScreen, ExerciseSessionScreen, PostSessionScreen } from '../screens';
import { JourneyDetailScreen } from '../screens/journey';
import { useAuth } from '../contexts';
import { Colors } from '../constants';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isLoading, onboardingCompleted } = useAuth();

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
      key={`root-${onboardingCompleted ? 'main' : 'onboarding'}`}
      initialRouteName={onboardingCompleted ? 'Main' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />

      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="ExerciseSession" component={ExerciseSessionScreen} />
      <Stack.Screen name="PostSession" component={PostSessionScreen} />
      <Stack.Screen name="JourneyDetail" component={JourneyDetailScreen} />

      <Stack.Screen name="Screening" component={ScreeningNavigator} />
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
