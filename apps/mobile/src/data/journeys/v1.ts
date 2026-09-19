import type { Journey } from '../../types';
import { seedExercises } from '../exercises';

/**
 * Versioned, local-first Journey content.
 *
 * Keeping the editorial catalog versioned and separate from persistence makes
 * future content revisions explicit rather than silently moving a resume point.
 */
export const JOURNEY_CONTENT_VERSION = 1 as const;

function exerciseIdForSlug(slug: string): string {
  const exercise = seedExercises.find((candidate) => candidate.slug === slug);
  if (!exercise) throw new Error(`Journey references missing exercise slug: ${slug}`);
  return exercise.id;
}

export const JOURNEYS_V1: readonly Journey[] = [
  {
    id: 'journey-return-to-center',
    version: JOURNEY_CONTENT_VERSION,
    slug: 'ritorno-al-centro',
    title: 'Ritorno al centro',
    description: 'Sette pratiche brevi per ritrovare orientamento, respiro e presenza.',
    chapters: [
      {
        id: 'notice',
        title: 'Notare senza giudicare',
        description: 'Inizia dal punto in cui ti trovi e lascia che il respiro rallenti il rumore.',
        order: 1,
        steps: [{ id: 'notice-practice', exerciseId: exerciseIdForSlug('2-minute-relaxation'), title: 'Pratica di arrivo', order: 1 }],
      },
      {
        id: 'ground',
        title: 'Sentire il corpo',
        description: 'Riporta l’attenzione alle sensazioni concrete del corpo appoggiato.',
        order: 2,
        steps: [{ id: 'ground-practice', exerciseId: exerciseIdForSlug('body-scan'), title: 'Ascolto del corpo', order: 1 }],
      },
      {
        id: 'breathe',
        title: 'Allungare il respiro',
        description: 'Costruisci un ritmo regolare senza forzare l’inspirazione o l’espirazione.',
        order: 3,
        steps: [{ id: 'breathe-practice', exerciseId: exerciseIdForSlug('diaphragmatic-breathing'), title: 'Respiro diaframmatico', order: 1 }],
      },
      {
        id: 'release',
        title: 'Lasciare andare',
        description: 'Riconosci la tensione e accompagnala verso un rilascio graduale.',
        order: 4,
        steps: [{ id: 'release-practice', exerciseId: exerciseIdForSlug('body-scan-meditation'), title: 'Rilascio graduale', order: 1 }],
      },
      {
        id: 'voice',
        title: 'Dare spazio alla voce',
        description: 'Usa una vibrazione morbida per stabilizzare attenzione e ritmo interno.',
        order: 5,
        steps: [{ id: 'voice-practice', exerciseId: exerciseIdForSlug('bhramari'), title: 'Vibrazione e ascolto', order: 1 }],
      },
      {
        id: 'restore',
        title: 'Ritrovare energia',
        description: 'Riattiva il corpo con una pratica breve, presente e sostenibile.',
        order: 6,
        steps: [{ id: 'restore-practice', exerciseId: exerciseIdForSlug('coherent-breathing'), title: 'Ritmo coerente', order: 1 }],
      },
      {
        id: 'return',
        title: 'Tornare al centro',
        description: 'Unisci ciò che hai osservato e porta questa calma nel resto della giornata.',
        order: 7,
        steps: [{ id: 'return-practice', exerciseId: exerciseIdForSlug('heart-breath'), title: 'Ritorno al centro', order: 1 }],
      },
    ],
  },
];
