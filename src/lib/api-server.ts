import { cookies } from 'next/headers';
import type { DashboardStats, Member, Ministry, PaginatedResponse, User } from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

class ServerApiError extends Error {
  status: number;

  constructor(status: number, path: string) {
    super(`API ${status}: ${path}`);
    this.status = status;
  }
}

async function serverFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('cms_token')?.value;

  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ServerApiError(response.status, path);
  }

  return response.json() as Promise<T>;
}

export async function getProfileServer(): Promise<User> {
  return serverFetch<User>('/users/profile');
}

export async function getMembersServer(params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Member>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('limit', String(params.limit ?? 20));
  if (params.search) searchParams.set('search', params.search);
  return serverFetch<PaginatedResponse<Member>>(`/members?${searchParams.toString()}`);
}

export async function getMemberServer(id: string): Promise<Member> {
  return serverFetch<Member>(`/members/${id}`);
}

export async function getMinistriesServer(params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Ministry>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('limit', String(params.limit ?? 20));
  if (params.search) searchParams.set('search', params.search);
  return serverFetch<PaginatedResponse<Ministry>>(`/ministries?${searchParams.toString()}`);
}

export async function getMinistryServer(id: string): Promise<Ministry> {
  return serverFetch<Ministry>(`/ministries/${id}`);
}

export async function getUsersServer(): Promise<User[]> {
  return serverFetch<User[]>('/users');
}

export async function getDashboardStatsServer(): Promise<DashboardStats> {
  return serverFetch<DashboardStats>('/dashboard/stats');
}
