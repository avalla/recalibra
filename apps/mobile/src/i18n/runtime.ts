import { getLocales } from 'expo-localization';
import { getLanguagePreference, saveLanguagePreference } from '../db/language';
import { i18n } from './core';
import { createLanguageController } from './controller';

const controller = createLanguageController(
  { read: getLanguagePreference, write: saveLanguagePreference },
  () => getLocales()[0]?.languageTag,
  language => i18n.language === language ? Promise.resolve() : i18n.changeLanguage(language),
);
export const languagePreference = controller.preference;
export const initializeLanguage = controller.initialize;
export const changeLanguagePreference = controller.change;
export const refreshSystemLanguage = controller.refresh;
