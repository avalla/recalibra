import { expect, test } from 'bun:test';
import { EMPTY_CATALOG_FILTERS, filterCatalog } from '../apps/mobile/src/utils/catalog-filters';
import { seedExercises } from '../apps/mobile/src/data/exercises';
import type { ExerciseWithFavorite } from '../apps/mobile/src/types';
import { Colors } from '../apps/mobile/src/constants/theme';

const exercises = seedExercises.map((exercise, index) => ({ ...exercise, id: String(index), is_favorite: false })) as ExerciseWithFavorite[];

test('duration labels correspond to the inclusive 3 / 4–7 / 8+ boundaries', () => {
  const fixtures = [2, 3, 4, 7, 8, 12].map((duration_minutes) => ({ ...exercises[0]!, duration_minutes }));
  expect(filterCatalog(fixtures, { ...EMPTY_CATALOG_FILTERS, duration: 'short' }).map(e => e.duration_minutes)).toEqual([2, 3]);
  expect(filterCatalog(fixtures, { ...EMPTY_CATALOG_FILTERS, duration: 'medium' }).map(e => e.duration_minutes)).toEqual([4, 7]);
  expect(filterCatalog(fixtures, { ...EMPTY_CATALOG_FILTERS, duration: 'long' }).map(e => e.duration_minutes)).toEqual([8, 12]);
});

test('search, category, level and duration combine, and clearing restores the whole catalog', () => {
  const chosen = exercises.find(e => e.level === 'beginner' && e.duration_minutes <= 3)!;
  const filtered = filterCatalog(exercises, { query: ` ${chosen.name.toUpperCase()} `, category: chosen.category, duration: 'short', level: 'beginner' });
  expect(filtered).toContain(chosen);
  expect(filtered.every(e => e.category === chosen.category && e.level === 'beginner' && e.duration_minutes <= 3)).toBeTrue();
  expect(filterCatalog(exercises, { ...EMPTY_CATALOG_FILTERS, query: 'no-such-exercise', level: 'advanced' })).toEqual([]);
  expect(filterCatalog(exercises, { ...EMPTY_CATALOG_FILTERS })).toEqual(exercises);
  expect(EMPTY_CATALOG_FILTERS.level).toBe('all');
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

test('secondary and muted copy meet 4.5:1 on every solid mobile surface', () => {
  for (const text of [Colors.textPrimary, Colors.textSecondary, Colors.textMuted]) {
    for (const background of [Colors.background, Colors.backgroundLight, Colors.backgroundCard, Colors.backgroundElevated]) {
      expect((luminance(text) + 0.05) / (luminance(background) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  }
});
