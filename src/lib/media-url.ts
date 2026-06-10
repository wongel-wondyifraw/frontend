import { API_BASE_URL } from '@/services/api';

export function getAvatarUrl(path: string | null | undefined, version?: string | number): string | null {
  if (!path) return null;
  const normalized = path.replace(/^\//, '');
  const base = `${API_BASE_URL}/${normalized}`;
  return version !== undefined ? `${base}?v=${version}` : base;
}

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}
