import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { UserMetadata } from '../types';
import { getDeviceUUID, isFirstLaunch } from '../utils/device';

interface LocalUser {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  user_metadata?: UserMetadata;
}

interface LocalSession {
  user: LocalUser;
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [deviceUUID, setDeviceUUID] = useState<string | null>(null);

  console.log('🔍 AuthProvider render - onboardingCompleted:', onboardingCompleted);

  const USER_STORAGE_KEY = '@recalibra:local_user_v1';
  const CREDENTIALS_EMAIL_KEY = '@recalibra:credentials_email_v1';
  const CREDENTIALS_PASSWORD_KEY = '@recalibra:credentials_password_v1';

  const generateUserId = (uuid: string) => `local_${uuid}`;

  const persistUser = async (nextUser: LocalUser) => {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  };

  const loadPersistedUser = async (): Promise<LocalUser | null> => {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as LocalUser;
      if (!parsed?.id) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const setAuthenticatedUser = async (nextUser: LocalUser) => {
    const nextSession: LocalSession = { user: nextUser };
    setUser(nextUser);
    setSession(nextSession);
    setIsAnonymous(!!nextUser.is_anonymous);
    await persistUser(nextUser);
  };

  // Initialize anonymous user on first launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check onboarding status first
        const onboardingStatus = await AsyncStorage.getItem('onboarding_completed');
        setOnboardingCompleted(onboardingStatus === 'true');
        
        // Get device UUID
        const uuid = await getDeviceUUID();
        setDeviceUUID(uuid);

        const persistedUser = await loadPersistedUser();
        if (persistedUser) {
          await setAuthenticatedUser(persistedUser);
          return;
        }

        // No stored user, create anonymous local user
        const anonymousUser: LocalUser = {
          id: generateUserId(uuid),
          is_anonymous: true,
          user_metadata: {
            onboarding_completed: onboardingStatus === 'true',
          },
        };
        await setAuthenticatedUser(anonymousUser);
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    return () => {
      // no-op
    };
  }, []);

  const userMetadata = (user?.user_metadata as UserMetadata | null) ?? null;

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      if (!deviceUUID) {
        return { error: new Error('Device UUID not available') };
      }

      await SecureStore.setItemAsync(CREDENTIALS_EMAIL_KEY, email);
      await SecureStore.setItemAsync(CREDENTIALS_PASSWORD_KEY, password);

      const nextUser: LocalUser = {
        id: generateUserId(deviceUUID),
        email,
        is_anonymous: false,
        user_metadata: {
          full_name: fullName,
          onboarding_completed: false,
        },
      };
      await setAuthenticatedUser(nextUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const storedEmail = await SecureStore.getItemAsync(CREDENTIALS_EMAIL_KEY);
      const storedPassword = await SecureStore.getItemAsync(CREDENTIALS_PASSWORD_KEY);

      if (!storedEmail || !storedPassword) {
        return { error: new Error('No local account found') };
      }

      if (storedEmail !== email || storedPassword !== password) {
        return { error: new Error('Invalid email or password') };
      }

      if (!deviceUUID) {
        return { error: new Error('Device UUID not available') };
      }

      const persisted = await loadPersistedUser();
      const nextUser: LocalUser = {
        id: persisted?.id ?? generateUserId(deviceUUID),
        email,
        is_anonymous: false,
        user_metadata: {
          ...(persisted?.user_metadata ?? {}),
        },
      };
      await setAuthenticatedUser(nextUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setSession(null);
      setUser(null);
      setIsAnonymous(false);
    }
  };

  const signInAnonymously = async () => {
    if (!deviceUUID) {
      return { error: new Error('Device UUID not available') };
    }
    return await signInAnonymouslyInternal(deviceUUID);
  };

  const signInAnonymouslyInternal = async (uuid: string) => {
    try {
      const nextUser: LocalUser = {
        id: generateUserId(uuid),
        is_anonymous: true,
        user_metadata: {
          onboarding_completed: onboardingCompleted,
        },
      };
      await setAuthenticatedUser(nextUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const upgradeAccount = async (email: string, password: string, fullName: string) => {
    if (!isAnonymous || !user) {
      return { error: new Error('No anonymous session to upgrade') };
    }

    try {
      await SecureStore.setItemAsync(CREDENTIALS_EMAIL_KEY, email);
      await SecureStore.setItemAsync(CREDENTIALS_PASSWORD_KEY, password);

      const nextUser: LocalUser = {
        id: user.id,
        email,
        is_anonymous: false,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          full_name: fullName,
          onboarding_completed: false,
        },
      };
      await setAuthenticatedUser(nextUser);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateUserMetadata = async (metadata: Partial<UserMetadata>) => {
    try {
      if (!user) {
        return { error: new Error('Auth session missing!') };
      }

      const nextUser: LocalUser = {
        ...user,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          ...metadata,
        },
      };

      await setAuthenticatedUser(nextUser);

      if (metadata.onboarding_completed === true) {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        setOnboardingCompleted(true);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const completeOnboarding = async () => {
    console.log('🔍 completeOnboarding called');
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('🔍 AsyncStorage updated');
      // Force a re-render by using a functional update
      setOnboardingCompleted(prev => {
        console.log('🔍 setOnboardingCompleted called with prev:', prev);
        return true;
      });
      console.log('🔍 onboardingCompleted state set to true');
    } catch (error) {
      console.error('🔍 Error in completeOnboarding:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userMetadata,
        isLoading,
        isAnonymous,
        onboardingCompleted,
        deviceUUID,
        signUp,
        signIn,
        signOut,
        signInAnonymously,
        upgradeAccount,
        updateUserMetadata,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
