import { API_BASE_URL } from '@/services/api';

function appendCacheBust(url: string, version?: string | number): string {
  if (version === undefined || version === null || version === '') return url;
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}v=${encodeURIComponent(String(version))}`;
}

/**
 * Resolve a stored media path (or absolute URL) against the API host.
 * Uploads are served from the backend at `/uploads/...`, not under `/api/v1`.
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  version?: string | number,
): string | null {
  if (!path) return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    if (/^(blob:|data:)/i.test(trimmed)) return trimmed;
    return appendCacheBust(trimmed, version);
  }

  const normalized = trimmed.replace(/^\/+/, '');
  return appendCacheBust(`${API_BASE_URL}/${normalized}`, version);
}

export function getAvatarUrl(
  path: string | null | undefined,
  version?: string | number,
): string | null {
  return resolveMediaUrl(path, version);
}

export function getImageUrl(path: string | null | undefined): string | null {
  return resolveMediaUrl(path);
}
