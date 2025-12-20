import { useState, useEffect, useCallback } from 'react';
import type { ExerciseWithFavorite, ExerciseCategory } from '../types';
import { getCache, setCache } from '../utils/cache';
import { logger } from '../utils/logger';
import { getExercisesWithFavorites, toggleFavorite as toggleFavoriteInDb } from '../db';

export const useExercises = () => {
  const [exercises, setExercises] = useState<ExerciseWithFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cacheKey = 'exercises_local_v1';
      const cachedExercises = await getCache<ExerciseWithFavorite[]>(cacheKey);
      if (cachedExercises) {
        logger.info('Loaded exercises from cache', 'useExercises');
        setExercises(cachedExercises);
        setIsLoading(false);
        return;
      }

      const exercisesWithFavorites = await getExercisesWithFavorites();

      setExercises(exercisesWithFavorites);

      // Cache the results for 5 minutes
      await setCache(cacheKey, exercisesWithFavorites, 5 * 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
      logger.error('Error fetching exercises', err as Error, 'useExercises');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const toggleFavorite = async (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const isFavorite = exercise.is_favorite;

    // Optimistic update
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId ? { ...e, is_favorite: !isFavorite } : e
      )
    );

    try {
      await toggleFavoriteInDb(exerciseId, !isFavorite);
    } catch (err) {
      // Revert optimistic update on error
      setExercises((prev) =>
        prev.map((e) =>
          e.id === exerciseId ? { ...e, is_favorite: isFavorite } : e
        )
      );
    }
  };

  const getExercisesByCategory = (category: ExerciseCategory) => {
    return exercises.filter((e) => e.category === category);
  };

  const getFavorites = () => {
    return exercises.filter((e) => e.is_favorite);
  };

  return {
    exercises,
    isLoading,
    error,
    refetch: fetchExercises,
    toggleFavorite,
    getExercisesByCategory,
    getFavorites,
  };
};
