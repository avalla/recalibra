export function slugifyBase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stableKey(input: { id: string; name: string }): string {
  return `${input.name.toLowerCase()}|${input.id.toLowerCase()}`;
}

export function buildUniqueSlugs(
  rows: Array<{ id: string; name: string }>
): Record<string, string> {
  const sorted = [...rows].sort((a, b) => stableKey(a).localeCompare(stableKey(b)));

  const byId: Record<string, string> = {};
  const counts = new Map<string, number>();

  for (const row of sorted) {
    const base = slugifyBase(row.name) || 'exercise';
    const nextCount = (counts.get(base) ?? 0) + 1;
    counts.set(base, nextCount);

    byId[row.id] = nextCount === 1 ? base : `${base}-${nextCount}`;
  }

  return byId;
}
