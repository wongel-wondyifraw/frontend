import type { LandingPageContent } from '@/types';
import { TENANT } from '@/lib/tenant';

/**
 * Minimal empty shell — public page shows only what is saved in the CMS.
 * No stock photos, sample ministries, or placeholder posts.
 */
export const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  hero: {
    enabled: true,
    title: TENANT.name,
    lede: '',
    image_url: null,
    cta_label: 'Staff login',
    secondary_cta_label: 'Explore the page',
  },
  about: {
    enabled: true,
    title: 'About us',
    subtitle: '',
    display_style: 'carousel',
    items: [],
  },
  vision: {
    enabled: true,
    title: 'Our vision',
    subtitle: '',
    label: '',
    heading: '',
    body: '',
    image_url: null,
  },
  projects: {
    enabled: true,
    title: 'Projects',
    subtitle: '',
    display_style: 'grid',
    items: [],
  },
  programs: {
    enabled: true,
    title: 'Programs',
    subtitle: '',
    display_style: 'carousel',
    default_poster_style: 'navy',
    items: [],
  },
  updates: {
    enabled: true,
    title: 'Latest updates',
    subtitle: '',
    display_style: 'feed',
    show_programs_strip: true,
    programs_strip_title: 'Recent programs',
    programs_display: 'marquee',
    posts: [],
  },
  contact: {
    enabled: true,
    title: 'Contact',
    subtitle: '',
    visit_title: 'Visit us',
    visit_lines: [],
    touch_title: 'Get in touch',
    touch_body: '',
  },
  footer: {
    blurb: '',
    visit_lines: [],
    office_lines: [],
  },
};

/** Prefer CMS values; never re-inject sample list content when CMS arrays are empty. */
export function mergeLandingContent(
  stored: Partial<LandingPageContent> | null | undefined,
): LandingPageContent {
  const base = DEFAULT_LANDING_CONTENT;
  if (!stored || typeof stored !== 'object') return { ...base };

  return {
    hero: { ...base.hero, ...stored.hero },
    about: {
      ...base.about,
      ...stored.about,
      items: Array.isArray(stored.about?.items) ? stored.about!.items! : base.about?.items || [],
    },
    vision: { ...base.vision, ...stored.vision },
    projects: {
      ...base.projects,
      ...stored.projects,
      items: Array.isArray(stored.projects?.items)
        ? stored.projects!.items!
        : base.projects?.items || [],
    },
    programs: {
      ...base.programs,
      ...stored.programs,
      items: Array.isArray(stored.programs?.items)
        ? stored.programs!.items!
        : base.programs?.items || [],
    },
    updates: {
      ...base.updates,
      ...stored.updates,
      posts: Array.isArray(stored.updates?.posts)
        ? stored.updates!.posts!
        : base.updates?.posts || [],
    },
    contact: {
      ...base.contact,
      ...stored.contact,
      visit_lines: Array.isArray(stored.contact?.visit_lines)
        ? stored.contact!.visit_lines!
        : base.contact?.visit_lines || [],
    },
    footer: {
      ...base.footer,
      ...stored.footer,
      visit_lines: Array.isArray(stored.footer?.visit_lines)
        ? stored.footer!.visit_lines!
        : base.footer?.visit_lines || [],
      office_lines: Array.isArray(stored.footer?.office_lines)
        ? stored.footer!.office_lines!
        : base.footer?.office_lines || [],
    },
  };
}

export function youtubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/youtube\.com\/embed\//i.test(trimmed) || /player\.vimeo\.com\//i.test(trimmed)) {
    return trimmed;
  }
  const yt =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i) ||
    trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return null;
  return null;
}

export function isDirectVideoFile(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
}
