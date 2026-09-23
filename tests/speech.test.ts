import { expect, mock, test } from 'bun:test';

let callbacks: {
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: unknown) => void;
} | undefined;

const nativeSpeak = mock((_text: string, options: typeof callbacks) => {
  callbacks = options;
});
const nativeStop = mock(async () => undefined);

mock.module('expo-speech', () => ({
  speak: nativeSpeak,
  stop: nativeStop,
}));

const { createSilentSpeechService, createSystemSpeechService } = await import('../apps/mobile/src/utils/speech');

test('silent speech does not call the platform provider', async () => {
  const callsBefore = nativeSpeak.mock.calls.length;
  await createSilentSpeechService().speak('not spoken');
  expect(nativeSpeak.mock.calls.length).toBe(callsBefore);
});

test('system speech resolves on completion and forwards options', async () => {
  callbacks = undefined;
  const promise = createSystemSpeechService().speak('Look up', { language: 'en-US', rate: 0.9 });
  expect(nativeSpeak).toHaveBeenCalledWith('Look up', expect.objectContaining({ language: 'en-US', rate: 0.9 }));
  callbacks?.onDone?.();
  await promise;
});

test('system speech rejects on provider errors and stop is best effort', async () => {
  callbacks = undefined;
  const promise = createSystemSpeechService().speak('Look away');
  callbacks?.onError?.(new Error('unavailable'));
  await expect(promise).rejects.toThrow('System speech is unavailable');
  await createSystemSpeechService().stop();
  expect(nativeStop).toHaveBeenCalled();
});
