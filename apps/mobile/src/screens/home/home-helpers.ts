export function getUserFirstName(fullName: string | undefined) {
  return fullName?.split(' ')[0] || 'there';
}
