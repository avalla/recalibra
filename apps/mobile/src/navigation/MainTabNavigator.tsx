import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home';
import { ExerciseNavigator } from './ExerciseNavigator';
import { ProgressScreen } from '../screens/progress';
import { ProfileScreen } from '../screens/profile';
import { Colors, FontSize } from '../constants';
import type { MainTabParamList } from '../types';

// Screens where we hide the tab bar for full immersion
const HIDDEN_TAB_BAR_SCREENS = ['ExerciseSession', 'PostSession'];

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName =
  | 'home'
  | 'home-outline'
  | 'fitness'
  | 'fitness-outline'
  | 'bar-chart'
  | 'bar-chart-outline'
  | 'person'
  | 'person-outline'
  | 'settings'
  | 'settings-outline';

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean): TabIconName => {
  switch (routeName) {
    case 'HomeTab':
      return focused ? 'home' : 'home-outline';
    case 'ExercisesTab':
      return focused ? 'fitness' : 'fitness-outline';
    case 'ProgressTab':
      return focused ? 'bar-chart' : 'bar-chart-outline';
    case 'ProfileTab':
      return focused ? 'settings' : 'settings-outline';
    default:
      return 'home-outline';
  }
};

const getTabLabel = (routeName: keyof MainTabParamList): string => {
  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'ExercisesTab':
      return 'Exercises';
    case 'ProgressTab':
      return 'Progress';
    case 'ProfileTab':
      return 'Settings';
    default:
      return '';
  }
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarLabel: getTabLabel(route.name),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen 
        name="ExercisesTab" 
        component={ExerciseNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ExerciseCatalog';
          return {
            headerShown: false,
            tabBarStyle: HIDDEN_TAB_BAR_SCREENS.includes(routeName) 
              ? { display: 'none' as const }
              : styles.tabBar,
          };
        }}
      />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 80,
  },
  tabBarLabel: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
