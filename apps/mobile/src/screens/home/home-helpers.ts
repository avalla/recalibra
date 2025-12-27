export function getUserFirstName(fullName: string | undefined) {
  return fullName?.split(' ')[0] || 'there';
}

export function createStressTrend() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return Array.from({ length: 7 }, (_, i) => ({
    day: days[i],
    value: Math.floor(Math.random() * 40) + 20,
  }));
}
