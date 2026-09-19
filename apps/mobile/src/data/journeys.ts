import type { JourneyDefinition } from '../types';

export const RETURN_TO_CENTER_JOURNEY_ID = 'journey-return-to-center';

export const returnToCenterJourney: JourneyDefinition = {
  id: RETURN_TO_CENTER_JOURNEY_ID,
  slug: 'ritorno-al-centro',
  title: 'Ritorno al centro',
  description: 'Sette pratiche brevi per ritrovare orientamento, respiro e presenza.',
  chapters: [
    { id: 'notice', title: 'Notare senza giudicare', description: 'Inizia dal punto in cui ti trovi e lascia che il respiro rallenti il rumore.', exerciseSlug: '2-minute-relaxation', durationMinutes: 2 },
    { id: 'ground', title: 'Sentire il corpo', description: 'Riporta l’attenzione alle sensazioni concrete del corpo appoggiato.', exerciseSlug: 'body-scan', durationMinutes: 5 },
    { id: 'breathe', title: 'Allungare il respiro', description: 'Costruisci un ritmo regolare senza forzare l’inspirazione o l’espirazione.', exerciseSlug: 'diaphragmatic-breathing', durationMinutes: 5 },
    { id: 'release', title: 'Lasciare andare', description: 'Riconosci la tensione e accompagnala verso un rilascio graduale.', exerciseSlug: 'body-scan-meditation', durationMinutes: 5 },
    { id: 'voice', title: 'Dare spazio alla voce', description: 'Usa una vibrazione morbida per stabilizzare attenzione e ritmo interno.', exerciseSlug: 'bhramari', durationMinutes: 5 },
    { id: 'restore', title: 'Ritrovare energia', description: 'Riattiva il corpo con una pratica breve, presente e sostenibile.', exerciseSlug: 'coherent-breathing', durationMinutes: 5 },
    { id: 'return', title: 'Tornare al centro', description: 'Unisci ciò che hai osservato e porta questa calma nel resto della giornata.', exerciseSlug: 'heart-breath', durationMinutes: 5 },
  ],
};

export const journeyDefinitions: JourneyDefinition[] = [returnToCenterJourney];
