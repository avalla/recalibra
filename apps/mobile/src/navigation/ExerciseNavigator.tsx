import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExerciseCatalogScreen, ExerciseSessionScreen, PostSessionScreen } from '../screens';
import type { ExerciseStackParamList } from '../types';

const Stack = createNativeStackNavigator<ExerciseStackParamList>();

export const ExerciseNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ExerciseCatalog" component={ExerciseCatalogScreen} />
      <Stack.Screen name="ExerciseSession" component={ExerciseSessionScreen} />
      <Stack.Screen name="PostSession" component={PostSessionScreen} />
    </Stack.Navigator>
  );
};
