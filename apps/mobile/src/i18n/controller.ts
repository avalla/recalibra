import { isLanguagePreference, resolveLanguage, type Language, type LanguagePreference } from './language';

interface LanguageStorage { read(): Promise<LanguagePreference>; write(value: LanguagePreference): Promise<void> }
export function createLanguageController(storage: LanguageStorage, systemTag: () => string | undefined, apply: (language: Language) => Promise<unknown>) {
  let preference: LanguagePreference = 'system';
  let tail = Promise.resolve();
  const enqueue = (work: () => Promise<void>) => {
    const operation = tail.then(work);
    tail = operation.catch(() => {});
    return operation;
  };
  return {
    preference: () => preference,
    initialize: () => enqueue(async () => {
      preference = await storage.read();
      await apply(resolveLanguage(preference, systemTag()));
    }),
    change: (next: LanguagePreference) => enqueue(async () => {
      if (!isLanguagePreference(next)) throw new Error('Unsupported language preference');
      await storage.write(next);
      preference = next;
      await apply(resolveLanguage(next, systemTag()));
    }),
    refresh: () => enqueue(async () => {
      if (preference === 'system') await apply(resolveLanguage(preference, systemTag()));
    }),
  };
}
