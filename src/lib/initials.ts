/** Initials for avatar fallbacks when no photo is available. */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
): string {
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  const middle = (middleName || '').trim();
  const a = first.charAt(0);
  const b = last.charAt(0) || middle.charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  return initials || '?';
}
