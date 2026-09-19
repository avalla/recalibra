/** Control the two native players as one cancellable playback operation. */
export interface LoopPlayer {
  currentTime: number;
  volume: number;
  play(): void;
  pause(): void;
  release(): void;
}

interface PlaybackOptions {
  createPlayer: (uri: string) => Promise<LoopPlayer | null>;
  onError: (error: unknown) => void;
  crossfadeStartMs: number;
  crossfadeDurationMs: number;
  monitorIntervalMs: number;
  timers?: Pick<typeof globalThis, 'setInterval' | 'clearInterval' | 'setTimeout' | 'clearTimeout'>;
}

export function createLoopPlayback(options: PlaybackOptions) {
  const timers = options.timers ?? globalThis;
  let active: LoopPlayer | null = null;
  let next: LoopPlayer | null = null;
  let generation = 0;
  let playing = false;
  let fading = false;
  let volume = 0.7;
  let fadeProgress = 0;
  let monitor: ReturnType<typeof setInterval> | null = null;
  let delay: { id: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;

  const release = (player: LoopPlayer | null) => {
    if (!player) return;
    try { player.pause(); } catch { /* Still attempt release. */ }
    try { player.release(); } catch { /* Native object may already be gone. */ }
  };

  const cancel = () => {
    generation += 1;
    playing = false;
    fading = false;
    if (monitor !== null) timers.clearInterval(monitor);
    monitor = null;
    if (delay) {
      timers.clearTimeout(delay.id);
      const resolve = delay.resolve;
      delay = null;
      resolve();
    }
  };

  const stop = () => {
    cancel();
    const oldActive = active;
    const oldNext = next;
    active = next = null;
    release(oldActive);
    release(oldNext);
  };

  const fail = (error: unknown) => { stop(); options.onError(error); };
  const isCurrent = (token: number) => playing && token === generation;

  const crossfade = async (uri: string, token: number) => {
    if (!isCurrent(token) || fading || !active) return;
    fading = true;
    const previous = active;
    try {
      const created = await options.createPlayer(uri);
      if (!isCurrent(token)) { release(created); return; }
      if (!created) throw new Error('Could not load audio');
      next = created;
      fadeProgress = 0;
      next.volume = 0;
      next.play();
      for (let step = 1; step <= 20; step++) {
        await new Promise<void>((resolve) => {
          const id = timers.setTimeout(() => { delay = null; resolve(); }, options.crossfadeDurationMs / 20);
          delay = { id, resolve };
        });
        if (!isCurrent(token)) return;
        fadeProgress = step / 20;
        previous.volume = volume * (1 - fadeProgress);
        created.volume = volume * fadeProgress;
      }
      if (!isCurrent(token)) return;
      active = created;
      next = null;
      release(previous);
    } catch (error) {
      if (isCurrent(token)) fail(error);
    } finally {
      if (token === generation) fading = false;
    }
  };

  const play = async (uri: string): Promise<boolean> => {
    if (playing) return true;
    playing = true;
    const token = ++generation;
    try {
      if (!active) {
        const created = await options.createPlayer(uri);
        if (!isCurrent(token)) { release(created); return false; }
        if (!created) throw new Error('Could not load audio');
        active = created;
      }
      if (!isCurrent(token)) return false;
      active.volume = volume;
      active.play();
      monitor = timers.setInterval(() => {
        if (!isCurrent(token) || !active || fading) return;
        try {
          if (active.currentTime * 1000 >= options.crossfadeStartMs) void crossfade(uri, token);
        } catch (error) { fail(error); }
      }, options.monitorIntervalMs);
      return true;
    } catch (error) {
      if (isCurrent(token)) fail(error);
      return false;
    }
  };

  const pause = () => {
    cancel();
    // Both may be playing during a crossfade. Keep the original position for
    // resume; discard the overlapping clip so only one player can restart.
    try { active?.pause(); } catch (error) { fail(error); }
    const oldNext = next;
    next = null;
    release(oldNext);
  };

  const setVolume = (value: number) => {
    volume = Math.max(0, Math.min(1, value));
    try {
      if (active) active.volume = volume * (fading ? 1 - fadeProgress : 1);
      if (next && fading) next.volume = volume * fadeProgress;
    } catch (error) { fail(error); }
  };

  return { play, pause, stop, setVolume, isPlaying: () => playing && active !== null };
}
