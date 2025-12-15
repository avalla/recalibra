import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts';
import type { MeditationExperience } from '../types';

export interface ScreeningData {
  meditation_experience: MeditationExperience;
  health_conditions: string[];
  initial_stress_level: number;
}

export const useScreening = () => {
  const { user, updateUserMetadata } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<Partial<ScreeningData>>({});

  // Update screening data locally
  const updateScreeningData = useCallback((data: Partial<ScreeningData>) => {
    setScreeningData((prev) => ({ ...prev, ...data }));
  }, []);

  // Save screening profile to Supabase
  const saveScreeningProfile = useCallback(async (finalData?: Partial<ScreeningData>) => {
    if (!user) return { error: new Error('User not authenticated') };

    setIsLoading(true);
    const dataToSave = { ...screeningData, ...finalData };

    try {
      // Upsert screening profile
      const { error: profileError } = await supabase
        .from('screening_profiles')
        .upsert({
          user_id: user.id,
          meditation_experience: dataToSave.meditation_experience || 'none',
          health_conditions: dataToSave.health_conditions || [],
          initial_stress_level: dataToSave.initial_stress_level || 5,
        }, {
          onConflict: 'user_id',
        });

      if (profileError) throw profileError;

      // Mark onboarding as completed in user metadata
      await updateUserMetadata({ onboarding_completed: true });

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      console.error('[useScreening] Error saving profile:', error);
      return { error };
    }
  }, [user, screeningData, updateUserMetadata]);

  // Check if user has completed screening
  const checkScreeningCompleted = useCallback(async () => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('screening_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return !error && !!data;
  }, [user]);

  return {
    screeningData,
    isLoading,
    updateScreeningData,
    saveScreeningProfile,
    checkScreeningCompleted,
  };
};
