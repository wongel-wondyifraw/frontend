/** Simulated multi-tenant church identity for the current deployment. */
export const TENANT = {
  name: "Goro Full Gospel Church",
  shortName: "Goro Full Gospel",
  logoSrc: "/full-gospel-logo.png",
  tagline: "Worship, fellowship, and discipleship in Goro.",
} as const;

/** Platform identity shown as “Powered by …” under tenant branding. */
export const PLATFORM = {
  name: "Shepherd.One",
  poweredByLabel: "Powered by Shepherd.One",
  websiteUrl: "https://shepherd.one",
  /** Public page / form for churches to request Shepherd.One */
  requestUrl: "https://shepherd.one/request",
  blurb:
    "This church website and ChMS portal run on Shepherd.One — church management for worship, discipleship, and administration.",
} as const;

export function pageTitle(page: string): string {
  return `${page} — ${TENANT.name}`;
}
