import { expect, test } from 'bun:test';
import { buildCycleSegments, createPracticeClock, formatPhaseRemaining, getBreathFrame, interruptPractice, usesTimedBreathing } from '../apps/mobile/src/utils/practice-timing';
import { seedExercises } from '../apps/mobile/src/data/exercises';

const pattern = { inhale: 4, hold: 2, exhale: 6, rest: 1 };
const segments = buildCycleSegments(pattern);

test('pause freezes phase, circle, ring, graph and elapsed time, including repeated pauses', () => {
  let now = 0;
  const clock = createPracticeClock(() => now);
  clock.resume(); now = 3000; clock.pause();
  const before = getBreathFrame(segments, clock.elapsed());
  expect(before.remainingSeconds).toBe(1);
  expect(before.circleScale).toBeCloseTo(0.9);
  now = 50000;
  expect(getBreathFrame(segments, clock.elapsed())).toEqual(before);
  clock.resume(); now += 500; clock.pause(); now += 15000; clock.resume(); now += 500;
  const after = getBreathFrame(segments, clock.elapsed());
  expect(clock.elapsed()).toBe(4000);
  expect(after.phase).toBe('hold');
  expect(after.circleScale).toBe(1);
  expect(after.phaseProgress).toBe(0);
});

test('holds, exhalations and cycle boundaries retain fractional elapsed time without drift', () => {
  expect(getBreathFrame(segments, 5000)).toMatchObject({ phase: 'hold', phaseProgress: 0.5, remainingSeconds: 1 });
  expect(getBreathFrame(segments, 9000)).toMatchObject({ phase: 'exhale', phaseProgress: 0.5, remainingSeconds: 3 });
  expect(getBreathFrame(segments, 13000)).toMatchObject({ phase: 'inhale', completedCycles: 1, phaseProgress: 0 });
  expect(getBreathFrame(segments, 13350).phaseProgress).toBeCloseTo(0.0875);
});

test('fractional countdown never grows within a phase; sub-second numerals are omitted', () => {
  for (const duration of [0.5, 1.5, 4]) {
    const displayed = Array.from({ length: 11 }, (_, index) => formatPhaseRemaining(duration * (1 - index / 10), duration));
    if (duration < 1) expect(displayed.every((value) => value === '')).toBeTrue();
    else for (let i = 1; i < displayed.length; i++) expect(parseFloat(displayed[i]!)).toBeLessThanOrEqual(parseFloat(displayed[i - 1]!));
  }
  const fractional = buildCycleSegments({ inhale: 0.5, hold: 0, exhale: 1.5, rest: 0 });
  expect(getBreathFrame(fractional, 500)).toMatchObject({ phase: 'exhale', remainingSeconds: 1.5 });
  expect(getBreathFrame(fractional, 2000)).toMatchObject({ phase: 'inhale', completedCycles: 1 });
});

test('background pauses countdown and playing without starting or counting inactive time', () => {
  expect(interruptPractice('stress_prompt')).toBe('stress_prompt');
  expect(interruptPractice('countdown')).toBe('countdown_paused');
  expect(interruptPractice('playing')).toBe('paused');
  expect(interruptPractice('paused')).toBe('paused');
  expect(interruptPractice('countdown_paused')).toBe('countdown_paused');
});

test('every special variant is classified; unsupported round and hold sequences never use a misleading circle', () => {
  const specials = new Set(seedExercises.flatMap((exercise) => exercise.breathing_pattern?.special ? [exercise.breathing_pattern.special] : []));
  expect([...specials].sort()).toEqual(['double_inhale', 'ha_sound', 'holotropic', 'humming', 'nine_rounds', 'rapid', 'rapid_exhale', 'reverse', 'roar', 'viloma', 'wim_hof']);
  const manual = ['rapid', 'rapid_exhale', 'holotropic', 'reverse', 'nine_rounds', 'viloma', 'wim_hof'];
  for (const exercise of seedExercises) {
    if (exercise.category !== 'breathing' || manual.includes(exercise.breathing_pattern?.special ?? '')) {
      expect(usesTimedBreathing(exercise.category, exercise.breathing_pattern)).toBeFalse();
      expect(exercise.instructions.length).toBeGreaterThan(0);
    }
  }
  expect(usesTimedBreathing('breathing', pattern)).toBeTrue();
  expect(usesTimedBreathing('breathing', { ...pattern, inhale: 0 })).toBeFalse();
});

test('double inhale has a distinct second phase and preserves the seed rest', () => {
  const sigh = buildCycleSegments({ inhale: 2, hold: 0, exhale: 8, rest: 2, special: 'double_inhale' });
  expect(getBreathFrame(sigh, 2000)).toMatchObject({ phase: 'inhale2', nextPhase: 'exhale' });
  expect(getBreathFrame(sigh, 11000)).toMatchObject({ phase: 'rest', nextPhase: 'inhale' });
});
