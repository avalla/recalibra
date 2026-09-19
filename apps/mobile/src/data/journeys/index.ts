export { JOURNEY_CONTENT_VERSION, JOURNEYS_V1 } from './v1';

import { JOURNEYS_V1 } from './v1';
import type { Journey } from '../../types';
import { validateJourney } from '../../utils/journeys';

export const journeys: readonly Journey[] = JOURNEYS_V1;

for (const journey of journeys) {
  if (journey.version !== 1) {
    throw new Error(`Journey ${journey.id} is not part of content catalog version 1.`);
  }
  validateJourney(journey);
}

export function getJourneyById(journeyId: string): Journey | undefined {
  return journeys.find((journey) => journey.id === journeyId);
}
