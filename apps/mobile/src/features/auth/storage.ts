import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  CREDENTIALS_EMAIL_KEY,
  CREDENTIALS_PASSWORD_KEY,
  ONBOARDING_COMPLETED_KEY,
  USER_STORAGE_KEY,
} from './keys';
import type { LocalUser } from './types';

export async function persistUser(nextUser: LocalUser) {
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
}

export async function loadPersistedUser(): Promise<LocalUser | null> {
  const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalUser;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearPersistedUser() {
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
}

export async function loadOnboardingCompleted(): Promise<boolean> {
  const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return onboardingStatus === 'true';
}

export async function persistOnboardingCompleted(value: boolean) {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, value ? 'true' : 'false');
}

export async function persistCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(CREDENTIALS_EMAIL_KEY, email);
  await SecureStore.setItemAsync(CREDENTIALS_PASSWORD_KEY, password);
}

export async function loadCredentials(): Promise<{ email: string; password: string } | null> {
  const email = await SecureStore.getItemAsync(CREDENTIALS_EMAIL_KEY);
  const password = await SecureStore.getItemAsync(CREDENTIALS_PASSWORD_KEY);

  if (!email || !password) return null;
  return { email, password };
}
