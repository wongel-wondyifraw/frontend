import { API_BASE_URL } from '@/services/api';
import {
  DEFAULT_LANDING_CONTENT,
  mergeLandingContent,
} from '@/lib/landing-defaults';
import type { LandingPageContent } from '@/types';

/**
 * Fetch public landing CMS content on the server so the hero URL is known
 * before client JS runs (critical for LCP discovery).
 */
export async function fetchLandingContent(): Promise<LandingPageContent> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/website/pages/landing`, {
      next: { revalidate: 60, tags: ['landing'] },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return DEFAULT_LANDING_CONTENT;
    }

    const page = (await res.json()) as { content?: unknown };
    const raw = page.content;
    const parsed =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as LandingPageContent)
        : {};
    return mergeLandingContent(parsed);
  } catch {
    return DEFAULT_LANDING_CONTENT;
  }
}
