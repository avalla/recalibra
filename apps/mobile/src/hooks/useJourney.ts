import { useCallback, useEffect, useState } from 'react';
import type { JourneyProgress } from '../types';
import { completeJourneyChapter, getJourneyProgress, startJourney } from '../db';
import { logger } from '../utils/logger';

export function useJourney(journeyId: string) {
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setProgress(await getJourneyProgress(journeyId));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossibile caricare il percorso';
      setError(message);
      logger.error('journey:load:error', err as Error, 'useJourney');
    } finally {
      setIsLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const begin = useCallback(async () => {
    const next = await startJourney(journeyId);
    setProgress(next);
    return next;
  }, [journeyId]);

  const completeChapter = useCallback(async (chapterIndex: number) => {
    const next = await completeJourneyChapter(journeyId, chapterIndex);
    setProgress(next);
    return next;
  }, [journeyId]);

  return { progress, isLoading, error, refresh, begin, completeChapter };
}
