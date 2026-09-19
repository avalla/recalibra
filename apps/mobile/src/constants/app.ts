// App Constants

export const APP_CONSTANTS = {
  // App Information
  NAME: 'Recalibra',
  VERSION: '1.0.0',
  
  // Session Constants
  MIN_SESSION_DURATION: 60, // 1 minute in seconds
  MAX_SESSION_DURATION: 3600, // 1 hour in seconds
  DEFAULT_SESSION_DURATION: 600, // 10 minutes in seconds
  
  // Audio Constants
  AUDIO_CROSSFADE_DURATION: 5000, // 5 seconds
  AUDIO_CHECK_INTERVAL: 500, // 500ms
  
  // Health Constants
  HEALTH_SYNC_INTERVAL: 300000, // 5 minutes in milliseconds
  
  // Notification Constants
  NOTIFICATION_CHECK_INTERVAL: 60000, // 1 minute in milliseconds
  
  // Stress Level Constants
  MIN_STRESS_LEVEL: 1,
  MAX_STRESS_LEVEL: 10,
  
  // Exercise Categories
  EXERCISE_CATEGORIES: [
    'breathing',
    'water',
    'movement',
    'sensory'
  ] as const,
  
  // Meditation Experience Levels
  MEDITATION_EXPERIENCE_LEVELS: [
    'none',
    'beginner',
    'intermediate',
    'advanced'
  ] as const,
  
  // Exercise Difficulty Levels
  EXERCISE_DIFFICULTY_LEVELS: [
    'beginner',
    'intermediate',
    'advanced'
  ] as const,
  
  // Reminder Times
  REMINDER_TIMES: [
    'morning',
    'afternoon',
    'evening'
  ] as const,
  
  // Storage Keys
  STORAGE_KEYS: {
    HAPTICS_ENABLED: '@recalibra:haptics_enabled',
    HEALTH_SYNC_ENABLED: '@recalibra:health_sync_enabled',
    ONBOARDING_COMPLETED: '@recalibra:onboarding_completed',
    LAST_SESSION_TIMESTAMP: '@recalibra:last_session_timestamp',
  },
  
  // Feature Flags
  FEATURE_FLAGS: {
    HEALTH_INTEGRATION_ENABLED: true,
    AUDIO_FEATURES_ENABLED: true,
    NOTIFICATIONS_ENABLED: true,
  },
  
  // Timeout Constants
  API_TIMEOUT: 10000, // 10 seconds
  NETWORK_CHECK_TIMEOUT: 5000, // 5 seconds
  
  // Retry Constants
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000, // 1 second
};

export type ExerciseCategory = typeof APP_CONSTANTS.EXERCISE_CATEGORIES[number];
export type MeditationExperience = typeof APP_CONSTANTS.MEDITATION_EXPERIENCE_LEVELS[number];
export type ExerciseDifficulty = typeof APP_CONSTANTS.EXERCISE_DIFFICULTY_LEVELS[number];
export type ReminderTime = typeof APP_CONSTANTS.REMINDER_TIMES[number];
