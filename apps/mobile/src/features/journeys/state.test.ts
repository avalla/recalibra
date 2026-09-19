import { describe, expect, test } from 'bun:test';
import { seedExercises } from '../../data/exercises';
import { journeyDefinitions } from '../../data/journeys';
import { canAccessExercise } from '../subscription/access';
import type { JourneyDefinition, JourneyProgress } from '../../types';
import {
  completeJourneyProgress,
  createInitialJourneyProgress,
  findInvalidJourneyExerciseSlugs,
  getJourneyEntryChapter,
  getNextJourneyChapter,
  normalizeJourneyProgress,
} from './state';

const journey: JourneyDefinition = {
  id: 'test-journey',
  slug: 'test-journey',
  title: 'Test journey',
  description: 'Test journey',
  chapters: [
    { id: 'chapter-0', title: 'Zero', description: '', exerciseSlug: 'free', durationMinutes: 1 },
    { id: 'chapter-1', title: 'One', description: '', exerciseSlug: 'premium', durationMinutes: 1 },
    { id: 'chapter-2', title: 'Two', description: '', exerciseSlug: 'free-2', durationMinutes: 1 },
  ],
};

const progress = (overrides: Partial<JourneyProgress> = {}): JourneyProgress => ({
  journeyId: journey.id,
  currentChapter: 0,
  completedChapterIds: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('journey state machine', () => {
  test('new journey starts at chapter 0', () => {
    expect(createInitialJourneyProgress(journey.id, 'now')).toMatchObject({ currentChapter: 0, completedChapterIds: [] });
  });

  test('completing chapter 0 unlocks chapter 1', () => {
    const next = completeJourneyProgress(progress(), journey, 0, '2026-01-01T01:00:00.000Z');
    expect(next.currentChapter).toBe(1);
    expect(next.completedChapterIds).toEqual(['chapter-0']);
  });

  test('a future chapter cannot be completed and a later retry remains possible', () => {
    const initial = progress();
    expect(() => completeJourneyProgress(initial, journey, 1, 'rejected')).toThrow('locked');
    expect(initial).toEqual(progress());
    expect(completeJourneyProgress(initial, journey, 0, 'retry')).toMatchObject({ currentChapter: 1 });
  });

  test('replaying a previous chapter never regresses progress', () => {
    const next = completeJourneyProgress(
      progress({ currentChapter: 2, completedChapterIds: ['chapter-0', 'chapter-1'] }),
      journey,
      0,
      'now'
    );
    expect(next.currentChapter).toBe(2);
  });

  test('double completion is idempotent and has no duplicate ids', () => {
    const once = completeJourneyProgress(progress(), journey, 0, 'first');
    const twice = completeJourneyProgress(once, journey, 0, 'second');
    expect(twice.completedChapterIds).toEqual(['chapter-0']);
    expect(new Set(twice.completedChapterIds).size).toBe(twice.completedChapterIds.length);
  });

  test('last chapter sets completedAt once', () => {
    const completed = completeJourneyProgress(
      progress({ currentChapter: 2, completedChapterIds: ['chapter-0', 'chapter-1'] }),
      journey,
      2,
      'first-completion'
    );
    const replay = completeJourneyProgress(completed, journey, 0, 'replay');
    expect(completed.completedAt).toBe('first-completion');
    expect(replay.completedAt).toBe('first-completion');
  });

  test('reload normalizes progress bounds and duplicate chapter ids', () => {
    const reloaded = normalizeJourneyProgress(
      progress({ currentChapter: 99, completedChapterIds: ['chapter-0', 'chapter-0', 'unknown'] }),
      journey
    );
    expect(reloaded.currentChapter).toBe(3);
    expect(reloaded.completedChapterIds).toEqual(['chapter-0']);
  });

  test('resume uses current chapter while completed journey replays from chapter 0', () => {
    expect(getJourneyEntryChapter(progress({ currentChapter: 2 }), journey.chapters.length)).toBe(2);
    expect(getJourneyEntryChapter(progress({ currentChapter: 3, completedAt: 'done' }), journey.chapters.length)).toBe(0);
  });

  test('post-completion navigation uses persisted progress, not requested chapter plus one', () => {
    expect(getNextJourneyChapter(progress({ currentChapter: 2 }), journey.chapters.length)).toBe(2);
    expect(getNextJourneyChapter(progress({ currentChapter: 3, completedAt: 'done' }), journey.chapters.length)).toBeNull();
  });

  test('bundled journey slugs all exist in bundled exercises', () => {
    expect(findInvalidJourneyExerciseSlugs(journeyDefinitions, seedExercises.map((exercise) => exercise.slug))).toEqual([]);
  });

  test('invalid slugs fail closed instead of resolving another exercise', () => {
    expect(findInvalidJourneyExerciseSlugs([journey], ['free'])).toEqual(['premium', 'free-2']);
  });

  test('free users can access free journey exercises through the shared rule', () => {
    expect(canAccessExercise(false, 'diaphragmatic-breathing', false)).toBe(true);
  });

  test('free users cannot access premium journey exercises through the shared rule', () => {
    expect(canAccessExercise(false, 'body-scan', true)).toBe(false);
  });

  test('premium users can access premium journey exercises through the shared rule', () => {
    expect(canAccessExercise(true, 'body-scan', true)).toBe(true);
  });
});
