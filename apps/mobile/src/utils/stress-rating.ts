import { tr } from '../i18n/core';
import type { Session } from '../types';

export const STRESS_OPTIONS = [
  { value: 1, label: 'Low', description: 'Calm and relaxed' },
  { value: 3, label: 'Mild', description: 'A little tension' },
  { value: 5, label: 'Moderate', description: 'Noticeable but manageable' },
  { value: 7, label: 'High', description: 'Tense and stressed' },
  { value: 10, label: 'Very high', description: 'Feeling overwhelmed' },
] as const;

export function isStressRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}

export function describeStressChange(pre: number | null, post: number | null) {
  if (!isStressRating(pre) || !isStressRating(post)) {
    return { title: tr("No comparison yet"), message: tr("A comparison needs a stress rating before and after this practice.") };
  }
  const change = post - pre;
  if (change === 0) {
    return { title: tr("Stress unchanged"), message: tr("You rated your stress {{post}}/10 both before and after this practice.", { post }) };
  }
  const points = Math.abs(change);
  return {
    title: tr("stressPoints", { count: points, sign: change > 0 ? "+" : "−" }),
    message: change > 0 ? tr("You rated your stress higher after this practice ({{pre}}/10 → {{post}}/10).", { pre, post }) : tr("You rated your stress lower after this practice ({{pre}}/10 → {{post}}/10).", { pre, post }),
  };
}

export function hasRecordedStressPair(session: Session): boolean {
  return session.pre_stress_recorded === true && session.post_stress_recorded === true
    && isStressRating(session.pre_stress_level) && isStressRating(session.post_stress_level);
}

export function summarizeSessionStress(sessions: Session[]) {
  const completed = sessions.filter((session) => session.completed_at);
  const rated = completed.filter((session) => session.post_stress_recorded === true && isStressRating(session.post_stress_level));
  const paired = completed.filter(hasRecordedStressPair);
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    averagePostStress: rated.length ? round(rated.reduce((sum, session) => sum + session.post_stress_level!, 0) / rated.length) : null,
    averageReduction: paired.length ? round(paired.reduce((sum, session) => sum + session.pre_stress_level! - session.post_stress_level!, 0) / paired.length) : null,
  };
}
