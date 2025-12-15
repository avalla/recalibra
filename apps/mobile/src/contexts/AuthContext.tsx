import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase, getAuthRedirectUrl } from '../lib/supabase';
import type { UserMetadata } from '../types';
import { appStateManager } from '../utils/appState';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userMetadata: UserMetadata | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUserMetadata: (metadata: Partial<UserMetadata>) => Promise<{ error: Error | null }>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Handle deeplinks (email confirmation, magic links, etc.)
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Extract tokens from URL and set session
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    };

    // Listen for deeplinks
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deeplink
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Refresh session when app comes to foreground
    const unsubscribeAppState = appStateManager.addListener((state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
      unsubscribeAppState();
    };
  }, []);

  const userMetadata = user?.user_metadata as UserMetadata | null;

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = getAuthRedirectUrl();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            onboarding_completed: false,
          },
          emailRedirectTo: redirectUrl,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUserMetadata = async (metadata: Partial<UserMetadata>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userMetadata,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateUserMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
