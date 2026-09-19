import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { i18n, currentLanguage } from './core';
import { languagePreference, changeLanguagePreference, refreshSystemLanguage } from './runtime';
import type { LanguagePreference } from './language';
import { syncReminders } from '../utils/reminders';
import { logger } from '../utils/logger';

const PreferenceContext = createContext({
  preference: 'system' as LanguagePreference,
  setPreference: async (_next: LanguagePreference) => {},
});
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState(languagePreference);
  useEffect(() => {
    const sync = () => { void syncReminders().catch(error => logger.error('Reminder language sync failed; will retry on foreground', error, 'i18n')); };
    sync();
    i18n.on('languageChanged', sync);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshSystemLanguage().then(sync).catch(error => logger.error('Language refresh failed', error, 'i18n'));
    });
    return () => { listener.remove(); i18n.off('languageChanged', sync); };
  }, []);
  const setPreference = async (next: LanguagePreference) => {
    await changeLanguagePreference(next);
    setPreferenceState(languagePreference());
  };
  return <I18nextProvider i18n={i18n}><PreferenceContext.Provider value={{ preference, setPreference }}>{children}</PreferenceContext.Provider></I18nextProvider>;
}
export function useLanguage() {
  useTranslation(undefined, { i18n, useSuspense: false });
  return { ...useContext(PreferenceContext), language: currentLanguage() };
}
