import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ScreeningExperienceScreen, 
  ScreeningHealthScreen, 
  ScreeningStressScreen 
} from '../screens';
import type { ScreeningStackParamList } from '../types';

const Stack = createNativeStackNavigator<ScreeningStackParamList>();

export const ScreeningNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ScreeningExperience" component={ScreeningExperienceScreen} />
      <Stack.Screen name="ScreeningHealth" component={ScreeningHealthScreen} />
      <Stack.Screen name="ScreeningStress" component={ScreeningStressScreen} />
    </Stack.Navigator>
  );
};
