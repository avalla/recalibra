import { expect, test } from 'bun:test';
import { createLoopPlayback, type LoopPlayer } from '../apps/mobile/src/utils/audio-playback';

function harness() {
  let timerId = 0;
  const intervals = new Map<number, () => void>();
  const timeouts = new Map<number, () => void>();
  const players: Array<LoopPlayer & { playing: boolean; released: boolean }> = [];
  const pending: Array<(player: LoopPlayer) => void> = [];
  const errors: unknown[] = [];
  const timers = {
    setInterval(callback: () => void) { intervals.set(++timerId, callback); return timerId; },
    clearInterval(id: number) { intervals.delete(id); },
    setTimeout(callback: () => void) { timeouts.set(++timerId, callback); return timerId; },
    clearTimeout(id: number) { timeouts.delete(id); },
  } as unknown as Pick<typeof globalThis, 'setInterval' | 'clearInterval' | 'setTimeout' | 'clearTimeout'>;
  const playback = createLoopPlayback({
    createPlayer: () => new Promise<LoopPlayer>((resolve) => pending.push(resolve)),
    onError: (error) => errors.push(error),
    crossfadeStartMs: 55000, crossfadeDurationMs: 5000, monitorIntervalMs: 500, timers,
  });
  const resolvePlayer = () => {
    let volume = 0;
    const player = {
      currentTime: 0, playing: false, released: false,
      get volume() { return volume; },
      set volume(value: number) { if (this.released) throw new Error('write after release'); volume = value; },
      play() { if (this.released) throw new Error('play after release'); this.playing = true; },
      pause() { if (this.released) throw new Error('pause after release'); this.playing = false; },
      release() { this.released = true; this.playing = false; },
    };
    players.push(player); pending.shift()!(player); return player;
  };
  const monitor = () => { for (const callback of intervals.values()) callback(); };
  const step = async () => { const callbacks = [...timeouts.values()]; timeouts.clear(); callbacks.forEach((callback) => callback()); await Promise.resolve(); };
  return { playback, resolvePlayer, players, pending, errors, intervals, timeouts, monitor, step };
}

for (const action of ['pause', 'stop'] as const) {
  test(`${action} during initial creation never starts the delayed player`, async () => {
    const h = harness(); const start = h.playback.play('tone'); h.playback[action]();
    const player = h.resolvePlayer();
    expect(await start).toBeFalse(); expect(player.playing).toBeFalse(); expect(player.released).toBeTrue(); expect(h.intervals.size).toBe(0);
  });
  test(`${action} while the crossfade player is being created cancels its ownership`, async () => {
    const h = harness(); const start = h.playback.play('tone'); const first = h.resolvePlayer(); await start;
    first.currentTime = 55; h.monitor(); h.playback[action](); const second = h.resolvePlayer(); await Promise.resolve();
    expect(first.playing).toBeFalse(); expect(second.playing).toBeFalse(); expect(second.released).toBeTrue(); expect(h.errors).toEqual([]);
    expect(h.intervals.size).toBe(0); expect(h.timeouts.size).toBe(0);
  });
  test(`${action} during overlap silences both and leaves no timers or writes to released players`, async () => {
    const h = harness(); const start = h.playback.play('tone'); const first = h.resolvePlayer(); await start;
    first.currentTime = 55; h.monitor(); const second = h.resolvePlayer(); await Promise.resolve(); await h.step();
    expect(first.playing && second.playing).toBeTrue();
    h.playback[action](); for (let i = 0; i < 25; i++) await h.step();
    expect(h.players.some((player) => player.playing)).toBeFalse(); expect(h.errors).toEqual([]); expect(h.intervals.size).toBe(0); expect(h.timeouts.size).toBe(0);
  });
}

test('pause and resume retains one player at its original position and restores the requested volume', async () => {
  const h = harness(); const start = h.playback.play('tone'); const first = h.resolvePlayer(); await start;
  first.currentTime = 55; h.monitor(); h.resolvePlayer(); await Promise.resolve(); await h.step();
  h.playback.pause(); h.playback.setVolume(0.4); await h.playback.play('tone');
  expect(h.players.filter((player) => player.playing)).toEqual([first]); expect(first.currentTime).toBe(55); expect(first.volume).toBe(0.4);
  h.playback.stop();
});

test('a complete crossfade transfers ownership once; stop/unmount releases both', async () => {
  const h = harness(); const start = h.playback.play('tone'); const first = h.resolvePlayer(); await start;
  first.currentTime = 55; h.monitor(); const second = h.resolvePlayer(); await Promise.resolve();
  for (let i = 0; i < 20; i++) await h.step();
  expect(first.released).toBeTrue(); expect(second.playing).toBeTrue(); expect(second.volume).toBeCloseTo(0.7);
  h.playback.stop(); h.playback.stop(); expect(second.released).toBeTrue(); expect(h.errors).toEqual([]);
});

test('replacement playback is not overwritten by an older delayed creation', async () => {
  const h = harness(); const old = h.playback.play('old'); h.playback.stop(); const replacement = h.playback.play('new');
  const oldPlayer = h.resolvePlayer(); const newPlayer = h.resolvePlayer();
  expect(await old).toBeFalse(); expect(await replacement).toBeTrue(); expect(oldPlayer.released).toBeTrue(); expect(newPlayer.playing).toBeTrue(); h.playback.stop();
});
