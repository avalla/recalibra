import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExerciseCatalogScreen } from '../screens';
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
    </Stack.Navigator>
  );
};
