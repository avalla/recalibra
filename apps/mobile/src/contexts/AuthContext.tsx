import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserMetadata } from '../types';
import { getDeviceUUID } from '../utils/device';
import type { AuthContextType, LocalSession, LocalUser } from '../features/auth';
import {
  clearPersistedUser,
  generateUserId,
  loadCredentials,
  loadOnboardingCompleted,
  loadPersistedUser,
  persistCredentials,
  persistOnboardingCompleted,
  persistUser,
} from '../features/auth';

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
        const onboardingStatus = await loadOnboardingCompleted();
        setOnboardingCompleted(onboardingStatus);
        
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
            onboarding_completed: onboardingStatus,
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

      await persistCredentials(email, password);

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
      const stored = await loadCredentials();
      if (!stored) {
        return { error: new Error('No local account found') };
      }

      if (stored.email !== email || stored.password !== password) {
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
      await clearPersistedUser();
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
      await persistCredentials(email, password);

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
        await persistOnboardingCompleted(true);
        setOnboardingCompleted(true);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const completeOnboarding = async () => {
    try {
      await persistOnboardingCompleted(true);
      setOnboardingCompleted(() => true);
    } catch (error) {
      console.error('[Auth] Error in completeOnboarding:', error);
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
