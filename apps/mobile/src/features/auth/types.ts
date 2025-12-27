import type { UserMetadata } from '../../types';

export interface LocalUser {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  user_metadata?: UserMetadata;
}

export interface LocalSession {
  user: LocalUser;
}

export interface AuthContextType {
  session: LocalSession | null;
  user: LocalUser | null;
  userMetadata: UserMetadata | null;
  isLoading: boolean;
  isAnonymous: boolean;
  onboardingCompleted: boolean;
  deviceUUID: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<{ error: Error | null }>;
  upgradeAccount: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  updateUserMetadata: (metadata: Partial<UserMetadata>) => Promise<{ error: Error | null }>;
  completeOnboarding: () => Promise<void>;
}
