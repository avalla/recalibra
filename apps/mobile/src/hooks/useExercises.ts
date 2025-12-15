import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts';
import type { Exercise, ExerciseWithFavorite, ExerciseCategory } from '../types';
import { getCache, setCache } from '../utils/cache';
import { logger } from '../utils/logger';

export const useExercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first (only if user hasn't changed)
      const cacheKey = user ? `exercises_${user.id}` : 'exercises';
      const cachedExercises = await getCache<ExerciseWithFavorite[]>(cacheKey);
      if (cachedExercises) {
        logger.info('Loaded exercises from cache', 'useExercises');
        setExercises(cachedExercises);
        setIsLoading(false);
        return;
      }

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (exercisesError) throw exercisesError;

      // Fetch user's favorites if logged in
      let userFavoriteIds: string[] = [];
      if (user) {
        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('exercise_id')
          .eq('user_id', user.id);
        
        userFavoriteIds = (favoritesData || []).map((f) => f.exercise_id);
      }

      // Merge exercises with favorite status
      const exercisesWithFavorites: ExerciseWithFavorite[] = (exercisesData || []).map((exercise) => ({
        ...exercise,
        is_favorite: userFavoriteIds.includes(exercise.id),
      }));

      setExercises(exercisesWithFavorites);

      // Cache the results for 5 minutes
      await setCache(cacheKey, exercisesWithFavorites, 5 * 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
      logger.error('Error fetching exercises', err as Error, 'useExercises');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const toggleFavorite = async (exerciseId: string) => {
    if (!user) return;

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
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, exercise_id: exerciseId });
      }
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
