import { tr } from './core';

// Canonical enum values stay in routes, SQLite, filters and ranking.
export function enumLabel(value: string): string {
  return tr(value.replaceAll('_', ' ').split(' ').map(word => word ? word[0].toUpperCase() + word.slice(1) : '').join(' '));
}
