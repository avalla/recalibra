import type { Exercise, GuidedAction, GuidedPlan, GuidedStep } from '../types';
import { usesTimedBreathing } from '../utils/practice-timing';

const EYE_YOGA_ID = '278d1121-8e6a-40f5-804b-c906eb19089e';
type GuidanceLanguage = 'it' | 'en';
const localized = (language: GuidanceLanguage, italian: string, english: string) => language === 'en' ? english : italian;

const speak = (text: string): GuidedAction => ({ type: 'speak', text });
const wait = (durationMs: number): GuidedAction => ({ type: 'wait', durationMs });
const visual = (cue: string, durationMs: number): GuidedAction => ({ type: 'visual', cue, durationMs });
const pulse: GuidedAction = { type: 'haptic', pattern: 'light' };

const breathingPhase = (cue: string, text: string, durationSeconds: number): GuidedAction[] => [
  speak(text),
  ...(durationSeconds > 0 ? [visual(cue, durationSeconds * 1000)] : []),
];

function createEyeYogaPlan(language: GuidanceLanguage): GuidedPlan {
  const copy = (italian: string, english: string) => localized(language, italian, english);
  return {
  mode: 'automatic',
  recommendedMode: 'automatic',
  supportsSpeed: true,
  steps: [
    {
      id: 'prepare',
      instruction: copy('Siediti comodamente e rilassa le spalle.', 'Sit comfortably and relax your shoulders.'),
      visualCue: 'ready',
      actions: [speak(copy('Siediti comodamente e rilassa le spalle.', 'Sit comfortably and relax your shoulders.')), wait(5000), pulse],
    },
    {
      id: 'up-down',
      instruction: copy('Guarda lentamente in alto, poi in basso. Ripeti 5 volte.', 'Look slowly up, then down. Repeat 5 times.'),
      visualCue: 'eyes-up',
      actions: [
        { type: 'repeat', times: 5, actions: [speak(copy('Guarda lentamente verso l’alto.', 'Look slowly up.')), visual('eyes-up', 1000), speak(copy('Ora guarda verso il basso.', 'Now look down.')), visual('eyes-down', 1000), wait(500)] },
      ],
    },
    {
      id: 'left-right',
      instruction: copy('Guarda a sinistra, poi a destra. Ripeti 5 volte.', 'Look left, then right. Repeat 5 times.'),
      visualCue: 'eyes-left-right',
      actions: [
        { type: 'repeat', times: 5, actions: [speak(copy('Guarda lentamente a sinistra.', 'Look slowly left.')), visual('eyes-left', 1000), speak(copy('Ora guarda a destra.', 'Now look right.')), visual('eyes-right', 1000), wait(500)] },
      ],
    },
    {
      id: 'diagonals',
      instruction: copy('Guarda nelle diagonali, senza muovere la testa. Ripeti 5 volte.', 'Look diagonally without moving your head. Repeat 5 times.'),
      visualCue: 'eyes-diagonal',
      actions: [
        { type: 'repeat', times: 5, actions: [speak(copy('Guarda in alto a sinistra, poi in basso a destra.', 'Look top-left, then bottom-right.')), visual('eyes-diagonal', 1800), speak(copy('Cambia diagonale.', 'Change diagonal.')), visual('eyes-diagonal-reverse', 1800), wait(500)] },
      ],
    },
    {
      id: 'circles',
      instruction: copy('Ruota lentamente gli occhi in entrambe le direzioni.', 'Slowly circle your eyes in both directions.'),
      visualCue: 'eyes-circle',
      actions: [
        speak(copy('Ruota lentamente gli occhi in senso orario.', 'Slowly circle your eyes clockwise.')), visual('eyes-circle', 5000),
        speak(copy('Ora cambia direzione.', 'Now change direction.')), visual('eyes-circle-reverse', 5000),
      ],
    },
    {
      id: 'rest',
      instruction: copy('Chiudi gli occhi e riposa per 30 secondi.', 'Close your eyes and rest for 30 seconds.'),
      visualCue: 'eyes-closed',
      actions: [speak(copy('Chiudi gli occhi e riposa.', 'Close your eyes and rest.')), visual('eyes-closed', 30000), pulse],
    },
  ],
  };
}

function createBreathingPlan(exercise: Exercise, language: GuidanceLanguage): GuidedPlan | undefined {
  const copy = (italian: string, english: string) => localized(language, italian, english);
  const pattern = exercise.breathing_pattern;
  if (!usesTimedBreathing(exercise.category, pattern) || !pattern) return undefined;

  const cycleSeconds = pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;
  const cycles = pattern.cycles ?? Math.max(1, Math.floor((exercise.duration_minutes * 60) / cycleSeconds));
  const actions: GuidedAction[] = [
    ...breathingPhase('breathing-in', copy('Inspira lentamente.', 'Breathe in slowly.'), pattern.inhale),
  ];
  if (pattern.hold > 0) actions.push(...breathingPhase('breathing-hold', copy('Trattieni dolcemente.', 'Hold gently.'), pattern.hold));
  actions.push(...breathingPhase('breathing-out', copy('Espira lentamente.', 'Breathe out slowly.'), pattern.exhale));
  if (pattern.rest > 0) actions.push(...breathingPhase('breathing-rest', copy('Riposa.', 'Rest.'), pattern.rest));

  return {
    mode: 'automatic',
    recommendedMode: 'automatic',
    supportsSpeed: true,
    steps: [{
      id: 'breathing-sequence',
      instruction: copy('Segui il ritmo del respiro.', 'Follow the rhythm of your breath.'),
      visualCue: 'breathing',
      actions: [{ type: 'repeat', times: cycles, actions }],
    }],
  };
}

export function getGuidedPlan(exercise: Exercise, language: GuidanceLanguage = 'it'): GuidedPlan | undefined {
  if (exercise.id === EYE_YOGA_ID || exercise.slug === 'eye-yoga') return createEyeYogaPlan(language);
  return createBreathingPlan(exercise, language);
}

export function getExercisePlan(exercise: Exercise, language: GuidanceLanguage = 'it'): GuidedPlan {
  return getGuidedPlan(exercise, language) ?? {
    mode: 'manual',
    recommendedMode: 'manual',
    steps: (exercise.instructions ?? []).map((item): GuidedStep => ({
      id: `legacy-${item.step}`,
      instruction: item.instruction,
      actions: [{ type: 'show', text: item.instruction }],
    })),
  };
}

export function scaleGuidedPlan(plan: GuidedPlan, speed: 'slow' | 'normal' | 'fast'): GuidedPlan {
  if (speed === 'normal' || !plan.supportsSpeed) return plan;
  const factor = speed === 'slow' ? 1.25 : 0.8;
  const scale = (actions: readonly GuidedAction[]): GuidedAction[] => actions.map((action) => {
    if (action.type === 'wait' || action.type === 'visual') {
      return { ...action, ...(action.durationMs === undefined ? {} : { durationMs: Math.max(100, Math.round(action.durationMs * factor)) }) };
    }
    if (action.type === 'repeat') return { ...action, actions: scale(action.actions) };
    return action;
  });
  return { ...plan, steps: plan.steps.map((step) => ({ ...step, actions: scale(step.actions) })) };
}
