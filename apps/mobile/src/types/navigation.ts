import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Screening Stack
export type ScreeningStackParamList = {
  ScreeningExperience: undefined;
  ScreeningHealth: undefined;
  ScreeningStress: undefined;
  ScreeningSummary: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  ExercisesTab: NavigatorScreenParams<ExerciseStackParamList>;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
};

// Exercise Stack
export type BreathingPatternParam = {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  special?: string;
  cycles?: number;
};

export type ExerciseFlowParamList = {
  ExerciseDetail: { exerciseId: string };
  ExerciseSession: {
    exerciseId: string;
    exerciseName: string;
    durationMinutes: number;
    audioPreset: string;
    exerciseCategory?: 'breathing' | 'water' | 'movement' | 'sensory';
    breathingPattern?: BreathingPatternParam;
    origin?: string;
    history?: string;
    benefits?: string[];
    tips?: string[];
    instructions?: { step: number; instruction: string }[];
    preStressLevel?: number;
  };
  PostSession: { sessionId: string; exerciseName: string; durationSeconds: number; preStressLevel: number };
};

export type ExerciseStackParamList = {
  ExerciseCatalog: undefined;
};

// Progress Stack
export type ProgressStackParamList = {
  Progress: undefined;
  SessionHistory: undefined;
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Onboarding: undefined;
  Screening: NavigatorScreenParams<ScreeningStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ExerciseDetail: ExerciseFlowParamList['ExerciseDetail'];
  ExerciseSession: ExerciseFlowParamList['ExerciseSession'];
  PostSession: ExerciseFlowParamList['PostSession'];
  Paywall: undefined;
  AccountUpgrade: undefined;
  QuickStartPreferences: { from?: 'home' | 'settings' } | undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type ExerciseStackScreenProps<T extends keyof ExerciseStackParamList> = 
  NativeStackScreenProps<ExerciseStackParamList, T>;

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
