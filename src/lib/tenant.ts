/** Simulated multi-tenant church identity for the current deployment. */
export const TENANT = {
  name: 'Goro Full Gospel Church',
  shortName: 'Goro Full Gospel',
  logoSrc: '/full-gospel-logo.jpg',
  tagline: 'Worship, fellowship, and discipleship in Goro.',
} as const;

/** Platform identity shown as “Powered by …” under tenant branding. */
export const PLATFORM = {
  name: 'Shepherd.One',
  poweredByLabel: 'Powered by Shepherd.One',
} as const;

export function pageTitle(page: string): string {
  return `${page} — ${TENANT.name}`;
}
