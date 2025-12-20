import { Colors } from './theme';

export const Gradients = {
  background: [Colors.background, Colors.backgroundLight],
  primary: [Colors.primaryLight, Colors.primary, Colors.primaryDark],
  ocean: ['#4FACFE', '#00F2FE'],
  mint: ['#43E97B', '#38F9D7'],
  sunset: ['#FF6B6B', '#FFE66D'],
} as const;

export type GradientKey = keyof typeof Gradients;

export function getGradient(key: GradientKey): readonly string[] {
  return Gradients[key];
}
