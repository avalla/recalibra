import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

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
  ExercisesTab: undefined;
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

export type ExerciseStackParamList = {
  ExerciseCatalog: undefined;
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
  };
  PostSession: { sessionId: string; exerciseName: string; durationSeconds: number; preStressLevel: number };
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
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Screening: NavigatorScreenParams<ScreeningStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Paywall: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

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
