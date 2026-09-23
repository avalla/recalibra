import { useState, useCallback } from 'react';
import { useAuth } from '../contexts';
import type { MeditationExperience } from '../types';
import { getScreening as getScreeningFromDb, setScreening as setScreeningInDb } from '../db';

export interface ScreeningData {
  meditation_experience: MeditationExperience;
  health_conditions: string[];
  initial_stress_level: number;
}

export const useScreening = () => {
  const { updateUserMetadata } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<Partial<ScreeningData>>({});

  // Update screening data locally
  const updateScreeningData = useCallback((data: Partial<ScreeningData>) => {
    setScreeningData((prev) => ({ ...prev, ...data }));
  }, []);

  // Save screening profile locally
  const saveScreeningProfile = useCallback(async (finalData?: Partial<ScreeningData>) => {
    setIsLoading(true);
    const dataToSave = { ...screeningData, ...finalData };

    try {
      await setScreeningInDb({
        meditation_experience: dataToSave.meditation_experience || 'none',
        health_conditions: dataToSave.health_conditions || [],
        initial_stress_level: dataToSave.initial_stress_level || 5,
      });

      // Mark onboarding as completed in user metadata and do not hide auth errors.
      const { error } = await updateUserMetadata({ onboarding_completed: true });
      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('[useScreening] Error saving profile:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  }, [screeningData, updateUserMetadata]);

  // Check if user has completed screening
  const checkScreeningCompleted = useCallback(async () => {
    const data = await getScreeningFromDb();
    return !!data;
  }, []);

  return {
    screeningData,
    isLoading,
    updateScreeningData,
    saveScreeningProfile,
    checkScreeningCompleted,
  };
};
