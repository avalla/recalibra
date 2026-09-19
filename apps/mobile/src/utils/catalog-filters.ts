import type { ExerciseCategory, ExerciseWithFavorite } from '../types';

export type CatalogFilters = {
  query: string;
  category: ExerciseCategory | 'all';
  duration: 'all' | 'short' | 'medium' | 'long';
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
};

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  query: '', category: 'all', duration: 'all', level: 'all',
};

export function filterCatalog(exercises: ExerciseWithFavorite[], filters: CatalogFilters) {
  const query = filters.query.trim().toLowerCase();
  return exercises.filter((exercise) => {
    if (query && !`${exercise.name} ${exercise.description ?? ''}`.toLowerCase().includes(query)) return false;
    if (filters.category !== 'all' && exercise.category !== filters.category) return false;
    if (filters.level !== 'all' && exercise.level !== filters.level) return false;
    const minutes = exercise.duration_minutes;
    if (filters.duration === 'short' && minutes > 3) return false;
    if (filters.duration === 'medium' && (minutes < 4 || minutes > 7)) return false;
    if (filters.duration === 'long' && minutes < 8) return false;
    return true;
  });
}
