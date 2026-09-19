import type { BreathingPattern, ExerciseCategory } from '../types';

export type BreathingPhase = 'inhale' | 'inhale2' | 'hold' | 'exhale' | 'rest' | 'retention';
export interface CycleSegment { phase: BreathingPhase; duration: number }
export type PracticeState = 'stress_prompt' | 'countdown' | 'countdown_paused' | 'playing' | 'paused';

// These variants need repetitions, nostril changes, recovery or user-led holds
// that cannot be represented by the seed's repeating four-duration pattern.
// Keep their original instructions, with explicit manual step advancement.
const MANUAL_SPECIALS = new Set(['rapid', 'rapid_exhale', 'holotropic', 'reverse', 'nine_rounds', 'viloma', 'wim_hof']);
const TIMED_SPECIALS = new Set(['double_inhale', 'humming', 'roar', 'ha_sound']);

export function usesTimedBreathing(category: ExerciseCategory | undefined, pattern?: BreathingPattern): boolean {
  if (category !== 'breathing' || !pattern) return false;
  if (!Number.isFinite(pattern.inhale) || pattern.inhale <= 0 || !Number.isFinite(pattern.exhale) || pattern.exhale <= 0) return false;
  if (pattern.special && (MANUAL_SPECIALS.has(pattern.special) || !TIMED_SPECIALS.has(pattern.special))) return false;
  return true;
}

export function buildCycleSegments(pattern: BreathingPattern): CycleSegment[] {
  const segments: CycleSegment[] = pattern.special === 'double_inhale'
    ? [{ phase: 'inhale', duration: pattern.inhale }, { phase: 'inhale2', duration: 1 }, { phase: 'exhale', duration: pattern.exhale }]
    : [{ phase: 'inhale', duration: pattern.inhale }, { phase: 'hold', duration: pattern.hold }, { phase: 'exhale', duration: pattern.exhale }];
  segments.push({ phase: 'rest', duration: pattern.rest });
  return segments.filter((segment) => Number.isFinite(segment.duration) && segment.duration > 0);
}

const phaseScale = (phase: BreathingPhase) => phase === 'inhale2' ? 1.1 : phase === 'inhale' || phase === 'hold' ? 1 : 0.6;

export function getBreathFrame(segments: CycleSegment[], elapsedMs: number) {
  const cycleMs = segments.reduce((sum, segment) => sum + segment.duration * 1000, 0);
  if (cycleMs <= 0) throw new Error('A breathing cycle needs a positive duration');
  const elapsed = Math.max(0, elapsedMs);
  const cycle = Math.floor(elapsed / cycleMs);
  const position = elapsed % cycleMs;
  let before = 0;
  let index = 0;
  while (index < segments.length - 1 && position >= before + segments[index]!.duration * 1000) {
    before += segments[index]!.duration * 1000;
    index += 1;
  }
  const segment = segments[index]!;
  const progress = Math.min(1, (position - before) / (segment.duration * 1000));
  const previous = segments[(index + segments.length - 1) % segments.length]!;
  return {
    phase: segment.phase,
    nextPhase: segments[(index + 1) % segments.length]!.phase,
    phaseDuration: segment.duration,
    remainingSeconds: Math.max(0, segment.duration - (position - before) / 1000),
    phaseProgress: progress,
    cycleProgress: position / cycleMs,
    activeSegmentIndex: index,
    transition: cycle * segments.length + index,
    completedCycles: cycle,
    circleScale: phaseScale(previous.phase) + (phaseScale(segment.phase) - phaseScale(previous.phase)) * progress,
  };
}

export function formatPhaseRemaining(remaining: number, phaseDuration: number): string {
  // A sub-second numeral is too brief to read. The phase name and visual rhythm
  // remain the guide. Longer fractional phases use a consistent tenth of a second.
  if (phaseDuration < 1) return '';
  const clamped = Math.max(0, Math.min(phaseDuration, remaining));
  if (!Number.isInteger(phaseDuration)) return `${(Math.ceil((clamped - 1e-9) * 10) / 10).toFixed(1)}s`;
  return `${Math.ceil(clamped)}s`;
}

export function interruptPractice(state: PracticeState): PracticeState {
  if (state === 'countdown') return 'countdown_paused';
  if (state === 'playing') return 'paused';
  return state;
}

export function createPracticeClock(now: () => number = () => performance.now()) {
  let accumulated = 0;
  let started: number | null = null;
  const elapsed = () => accumulated + (started === null ? 0 : Math.max(0, now() - started));
  return {
    elapsed,
    resume() { if (started === null) started = now(); },
    pause() { accumulated = elapsed(); started = null; },
  };
}
