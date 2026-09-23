import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
}

export interface SpeechService {
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stop(): Promise<void>;
}

export const createSilentSpeechService = (): SpeechService => ({
  speak: async () => undefined,
  stop: async () => undefined,
});

export function createSystemSpeechService(): SpeechService {
  return {
    speak: (text, options = {}) => new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          ...options,
          onDone: resolve,
          onStopped: resolve,
          onError: () => reject(new Error('System speech is unavailable')),
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }),
    stop: async () => {
      try {
        await Speech.stop();
      } catch {
        // A missing voice must not interrupt the guided session.
      }
    },
  };
}
