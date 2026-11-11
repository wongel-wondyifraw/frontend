'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import axios from 'axios';
import {
  createMember as apiCreateMember,
  deleteMember as apiDeleteMember,
  getMemberById as apiGetMemberById,
  getMembers as apiGetMembers,
  updateMember as apiUpdateMember,
} from '@/services/api';
import { getApiErrorMessage, NETWORK_EVENT } from '@/lib/errors';
import { useUser } from '@/context/UserContext';
import type {
  CalendarDateFieldValue,
  CalendarSystem,
  Member,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export type MemberFilters = {
  status?: string;
  marital_status?: string;
  joined_from?: string;
  joined_to?: string;
  joined_calendar: CalendarSystem;
  sort_by: 'created_at' | 'joined_date' | 'visit_count';
  sort_order: 'ASC' | 'DESC';
};

export const DEFAULT_MEMBER_FILTERS: MemberFilters = {
  joined_calendar: 'gc',
  sort_by: 'created_at',
  sort_order: 'DESC',
};

export interface MembersQueryState {
  page: number;
  limit: number;
  search: string;
  filters: MemberFilters;
}

export const DEFAULT_MEMBERS_QUERY: MembersQueryState = {
  page: 1,
  limit: 10,
  search: '',
  filters: DEFAULT_MEMBER_FILTERS,
};

export const DEFAULT_DATE_BOUND_FIELD: CalendarDateFieldValue = {
  date: null,
  precision: 'day',
  calendar: 'gc',
};

export interface MembersPageEntry {
  key: string;
  ids: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  fetchedAt: number;
  version: number;
  source: 'ssr' | 'csr';
}

interface CreatedMemberRecord {
  member: Member;
  version: number;
  createdAt: number;
}

interface UpdatedMemberRecord {
  member: Member;
  version: number;
  updatedAt: number;
}

export interface MembersState {
  byId: Record<string, Member>;
  pagesByKey: Record<string, MembersPageEntry>;
  activeQuery: MembersQueryState;
  joinedFromField: CalendarDateFieldValue;
  joinedToField: CalendarDateFieldValue;
  listLoading: boolean;
  revalidating: boolean;
  listError: string | null;
  detailLoadingById: Record<string, boolean>;
  mutatingById: Record<string, boolean>;
  mutationVersion: number;
  createdRecords: Record<string, CreatedMemberRecord>;
  updatedRecords: Record<string, UpdatedMemberRecord>;
  deletedIds: Record<string, number>;
  needsRevalidation: boolean;
}

const SESSION_RECONCILE_TTL_MS = 120_000;

export function buildMembersQueryKey(query: MembersQueryState): string {
  const calendar =
    query.filters.joined_from || query.filters.joined_to
      ? query.filters.joined_calendar
      : 'gc';
  return JSON.stringify([
    query.page,
    query.limit,
    query.search.trim(),
    query.filters.status || '',
    query.filters.marital_status || '',
    query.filters.joined_from || '',
    query.filters.joined_to || '',
    calendar,
    query.filters.sort_by,
    query.filters.sort_order,
  ]);
}

export function isDefaultUnfilteredPageOneQuery(query: MembersQueryState): boolean {
  return (
    query.page === 1 &&
    !query.search.trim() &&
    !query.filters.status &&
    !query.filters.marital_status &&
    !query.filters.joined_from &&
    !query.filters.joined_to &&
    query.filters.sort_by === 'created_at' &&
    query.filters.sort_order === 'DESC'
  );
}

function toTimestampMs(value?: string | Date | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function pickNewerMemberRecord(
  existing: Member | undefined,
  incoming: Member,
  recentUpdate: UpdatedMemberRecord | undefined,
): { member: Member; serverCaughtUp: boolean } {
  if (!recentUpdate) {
    return { member: existing ? { ...existing, ...incoming } : incoming, serverCaughtUp: true };
  }

  const incomingUpdatedMs = toTimestampMs(incoming.updated_at);
  const localUpdatedMs = toTimestampMs(recentUpdate.member.updated_at);

  const serverIsStrictlyOlder =
    incomingUpdatedMs > 0 && localUpdatedMs > 0 && incomingUpdatedMs < localUpdatedMs;
  const sameTimestampMismatch =
    incomingUpdatedMs === localUpdatedMs &&
    (incoming.status !== recentUpdate.member.status ||
      incoming.first_name !== recentUpdate.member.first_name ||
      incoming.last_name !== recentUpdate.member.last_name);

  if (serverIsStrictlyOlder || sameTimestampMismatch || (!incoming.updated_at && localUpdatedMs > 0)) {
    return {
      member: { ...(existing ?? {}), ...incoming, ...recentUpdate.member },
      serverCaughtUp: false,
    };
  }

  return {
    member: { ...(existing ?? {}), ...incoming },
    serverCaughtUp: true,
  };
}

function applyMutationReconciliation(
  state: MembersState,
  query: MembersQueryState,
  pageResult: PaginatedResponse<Member>,
  source: 'ssr' | 'csr',
  now: number,
): {
  byId: Record<string, Member>;
  ids: string[];
  total: number;
  totalPages: number;
  createdRecords: Record<string, CreatedMemberRecord>;
  updatedRecords: Record<string, UpdatedMemberRecord>;
} {
  const nextById: Record<string, Member> = { ...state.byId };
  const nextCreatedRecords: Record<string, CreatedMemberRecord> = { ...state.createdRecords };
  const nextUpdatedRecords: Record<string, UpdatedMemberRecord> = { ...state.updatedRecords };

  if (source === 'csr') {
    for (const [id, rec] of Object.entries(nextUpdatedRecords)) {
      if (now - rec.updatedAt > SESSION_RECONCILE_TTL_MS) {
        delete nextUpdatedRecords[id];
      }
    }
    for (const [id, rec] of Object.entries(nextCreatedRecords)) {
      if (now - rec.createdAt > SESSION_RECONCILE_TTL_MS) {
        delete nextCreatedRecords[id];
      }
    }
  }

  const resolvedRows: Member[] = [];
  const seenIds = new Set<string>();
  let deletedFromResultCount = 0;

  for (const row of pageResult.data) {
    if (state.deletedIds[row.id]) {
      deletedFromResultCount += 1;
      continue;
    }

    const { member: merged, serverCaughtUp } = pickNewerMemberRecord(
      nextById[row.id],
      row,
      nextUpdatedRecords[row.id],
    );

    if (source === 'csr' && serverCaughtUp && nextUpdatedRecords[row.id]) {
      delete nextUpdatedRecords[row.id];
    }

    if (nextCreatedRecords[row.id]) {
      if (source === 'csr') {
        delete nextCreatedRecords[row.id];
      } else {
        nextCreatedRecords[row.id] = {
          ...nextCreatedRecords[row.id],
          member: merged,
        };
      }
    }

    nextById[row.id] = merged;
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id);
      resolvedRows.push(merged);
    }
  }

  let adjustedTotal = Math.max(0, pageResult.total - deletedFromResultCount);

  // On default page-1 newest-first views, keep any just-created member visible if SSR router cache
  // or a lagging upstream proxy returns a snapshot that hasn't reflected the insert yet.
  if (isDefaultUnfilteredPageOneQuery(query)) {
    const oldestResultCreatedAt =
      resolvedRows.length > 0
        ? toTimestampMs(resolvedRows[resolvedRows.length - 1]?.created_at)
        : 0;

    const missingCreated = Object.values(nextCreatedRecords)
      .filter((entry) => !state.deletedIds[entry.member.id] && !seenIds.has(entry.member.id))
      .sort((a, b) => {
        const diff =
          toTimestampMs(b.member.created_at ?? new Date(b.createdAt).toISOString()) -
          toTimestampMs(a.member.created_at ?? new Date(a.createdAt).toISOString());
        return diff !== 0 ? diff : b.version - a.version;
      });

    let prependedCount = 0;
    const prependedRows: Member[] = [];

    for (const entry of missingCreated) {
      const entryCreatedMs =
        toTimestampMs(entry.member.created_at) || entry.createdAt;
      const pushedPastPageOne =
        pageResult.data.length >= pageResult.limit &&
        oldestResultCreatedAt > entryCreatedMs;

      if (pushedPastPageOne) {
        if (source === 'csr') {
          delete nextCreatedRecords[entry.member.id];
        }
        continue;
      }

      const effective = nextUpdatedRecords[entry.member.id]?.member ?? entry.member;
      nextById[effective.id] = { ...(nextById[effective.id] ?? {}), ...effective };
      prependedRows.push(nextById[effective.id]);
      seenIds.add(effective.id);
      prependedCount += 1;
    }

    if (prependedRows.length > 0) {
      const combined = [...prependedRows, ...resolvedRows].slice(0, pageResult.limit);
      adjustedTotal += prependedCount;
      const totalPages = Math.max(1, Math.ceil(adjustedTotal / pageResult.limit));
      return {
        byId: nextById,
        ids: combined.map((m) => m.id),
        total: adjustedTotal,
        totalPages,
        createdRecords: nextCreatedRecords,
        updatedRecords: nextUpdatedRecords,
      };
    }
  }

  const totalPages = Math.max(
    1,
    pageResult.totalPages || Math.ceil(adjustedTotal / pageResult.limit) || 1,
  );

  return {
    byId: nextById,
    ids: resolvedRows.map((m) => m.id),
    total: adjustedTotal,
    totalPages,
    createdRecords: nextCreatedRecords,
    updatedRecords: nextUpdatedRecords,
  };
}

export function resolveMembersPageFromState(
  state: MembersState,
  initialPage: PaginatedResponse<Member> | null,
): {
  rows: Member[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
} {
  const activeKey = buildMembersQueryKey(state.activeQuery);
  const cached = state.pagesByKey[activeKey];

  if (cached) {
    const rows = cached.ids
      .filter((id) => !state.deletedIds[id])
      .map((id) => state.byId[id])
      .filter((m): m is Member => Boolean(m));
    return {
      rows,
      total: cached.total,
      page: cached.page,
      limit: cached.limit,
      loading: state.listLoading,
    };
  }

  if (
    initialPage !== null &&
    isDefaultUnfilteredPageOneQuery(state.activeQuery) &&
    state.activeQuery.limit === initialPage.limit
  ) {
    // Pure read-only preview so first SSR paint & client hydration render identical rows
    const reconciled = applyMutationReconciliation(
      state,
      state.activeQuery,
      initialPage,
      'ssr',
      0,
    );
    const rows = reconciled.ids
      .map((id) => reconciled.byId[id])
      .filter((m): m is Member => Boolean(m));
    return {
      rows,
      total: reconciled.total,
      page: initialPage.page,
      limit: initialPage.limit,
      loading: false,
    };
  }

  return {
    rows: [],
    total: 0,
    page: state.activeQuery.page,
    limit: state.activeQuery.limit,
    loading: state.listLoading || initialPage === null,
  };
}

const INITIAL_STATE: MembersState = {
  byId: {},
  pagesByKey: {},
  activeQuery: DEFAULT_MEMBERS_QUERY,
  joinedFromField: DEFAULT_DATE_BOUND_FIELD,
  joinedToField: DEFAULT_DATE_BOUND_FIELD,
  listLoading: false,
  revalidating: false,
  listError: null,
  detailLoadingById: {},
  mutatingById: {},
  mutationVersion: 0,
  createdRecords: {},
  updatedRecords: {},
  deletedIds: {},
  needsRevalidation: false,
};

type MembersAction =
  | { type: 'RESET' }
  | { type: 'HYDRATE_SSR_PAGE'; initialPage: PaginatedResponse<Member> }
  | { type: 'HYDRATE_SSR_MEMBER'; member: Member }
  | { type: 'SET_SEARCH_INPUT'; search: string }
  | { type: 'SET_DATE_BOUNDS'; from?: CalendarDateFieldValue; to?: CalendarDateFieldValue }
  | { type: 'FETCH_PAGE_START'; key: string; query: MembersQueryState; silent: boolean }
  | {
      type: 'FETCH_PAGE_SUCCESS';
      key: string;
      query: MembersQueryState;
      result: PaginatedResponse<Member>;
      startedAtVersion: number;
      fetchedAt: number;
    }
  | { type: 'FETCH_PAGE_ERROR'; error: string; silent: boolean }
  | { type: 'DETAIL_FETCH_START'; id: string; silent: boolean }
  | { type: 'DETAIL_FETCH_SUCCESS'; member: Member }
  | { type: 'DETAIL_FETCH_ERROR'; id: string }
  | { type: 'SET_MUTATING'; id: string; active: boolean }
  | { type: 'MEMBER_CREATED'; member: Member; now: number }
  | { type: 'MEMBER_UPDATED'; member: Member; now: number }
  | { type: 'MEMBER_DELETED'; id: string }
  | { type: 'BULK_MEMBERS_IMPORTED' };

function membersReducer(state: MembersState, action: MembersAction): MembersState {
  switch (action.type) {
    case 'RESET':
      return INITIAL_STATE;

    case 'HYDRATE_SSR_PAGE': {
      const ssrQuery: MembersQueryState = {
        page: action.initialPage.page,
        limit: action.initialPage.limit,
        search: '',
        filters: DEFAULT_MEMBER_FILTERS,
      };
      const key = buildMembersQueryKey(ssrQuery);
      const existing = state.pagesByKey[key];
      // Do not overwrite an already-fresher CSR or mutated page recorded at the latest mutation version
      if (
        existing &&
        (existing.source === 'csr' || existing.version > 0) &&
        existing.version >= state.mutationVersion
      ) {
        return state;
      }

      const reconciled = applyMutationReconciliation(
        state,
        ssrQuery,
        action.initialPage,
        'ssr',
        0,
      );

      return {
        ...state,
        byId: reconciled.byId,
        createdRecords: reconciled.createdRecords,
        updatedRecords: reconciled.updatedRecords,
        pagesByKey: {
          ...state.pagesByKey,
          [key]: {
            key,
            ids: reconciled.ids,
            total: reconciled.total,
            page: action.initialPage.page,
            limit: action.initialPage.limit,
            totalPages: reconciled.totalPages,
            fetchedAt: existing?.fetchedAt ?? 0,
            version: state.mutationVersion,
            source: 'ssr',
          },
        },
        listLoading: false,
      };
    }

    case 'HYDRATE_SSR_MEMBER': {
      if (state.deletedIds[action.member.id]) {
        return state;
      }
      const existing = state.byId[action.member.id];
      const recentUpdate = state.updatedRecords[action.member.id];
      const { member: merged } = pickNewerMemberRecord(existing, action.member, recentUpdate);
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.member.id]: merged,
        },
      };
    }

    case 'SET_SEARCH_INPUT':
      return {
        ...state,
        activeQuery: {
          ...state.activeQuery,
          search: action.search,
        },
      };

    case 'SET_DATE_BOUNDS':
      return {
        ...state,
        joinedFromField: action.from ?? state.joinedFromField,
        joinedToField: action.to ?? state.joinedToField,
      };

    case 'FETCH_PAGE_START': {
      const hasCached = Boolean(state.pagesByKey[action.key]);
      return {
        ...state,
        activeQuery: action.query,
        listLoading: !action.silent && !hasCached ? true : !action.silent,
        revalidating: action.silent,
        listError: null,
      };
    }

    case 'FETCH_PAGE_SUCCESS': {
      if (state.mutationVersion > action.startedAtVersion) {
        return {
          ...state,
          listLoading: false,
          revalidating: false,
        };
      }

      const reconciled = applyMutationReconciliation(
        state,
        action.query,
        action.result,
        'csr',
        action.fetchedAt,
      );

      return {
        ...state,
        byId: reconciled.byId,
        createdRecords: reconciled.createdRecords,
        updatedRecords: reconciled.updatedRecords,
        pagesByKey: {
          ...state.pagesByKey,
          [action.key]: {
            key: action.key,
            ids: reconciled.ids,
            total: reconciled.total,
            page: action.result.page,
            limit: action.result.limit,
            totalPages: reconciled.totalPages,
            fetchedAt: action.fetchedAt,
            version: state.mutationVersion,
            source: 'csr',
          },
        },
        listLoading: false,
        revalidating: false,
        listError: null,
        needsRevalidation: false,
      };
    }

    case 'FETCH_PAGE_ERROR':
      return {
        ...state,
        listLoading: false,
        revalidating: false,
        listError: action.silent ? state.listError : action.error,
      };

    case 'DETAIL_FETCH_START': {
      if (action.silent) return state;
      return {
        ...state,
        detailLoadingById: {
          ...state.detailLoadingById,
          [action.id]: true,
        },
      };
    }

    case 'DETAIL_FETCH_SUCCESS': {
      if (state.deletedIds[action.member.id]) {
        const nextDetailLoading = { ...state.detailLoadingById };
        delete nextDetailLoading[action.member.id];
        return { ...state, detailLoadingById: nextDetailLoading };
      }
      const recentUpdate = state.updatedRecords[action.member.id];
      const { member: merged, serverCaughtUp } = pickNewerMemberRecord(
        state.byId[action.member.id],
        action.member,
        recentUpdate,
      );
      const nextUpdated = { ...state.updatedRecords };
      if (serverCaughtUp && nextUpdated[action.member.id]) {
        delete nextUpdated[action.member.id];
      }
      const nextDetailLoading = { ...state.detailLoadingById };
      delete nextDetailLoading[action.member.id];
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.member.id]: merged,
        },
        updatedRecords: nextUpdated,
        detailLoadingById: nextDetailLoading,
      };
    }

    case 'DETAIL_FETCH_ERROR': {
      const nextDetailLoading = { ...state.detailLoadingById };
      delete nextDetailLoading[action.id];
      return {
        ...state,
        detailLoadingById: nextDetailLoading,
      };
    }

    case 'SET_MUTATING': {
      const nextMutating = { ...state.mutatingById };
      if (action.active) {
        nextMutating[action.id] = true;
      } else {
        delete nextMutating[action.id];
      }
      return {
        ...state,
        mutatingById: nextMutating,
      };
    }

    case 'MEMBER_CREATED': {
      const nextVersion = state.mutationVersion + 1;
      const nextDeletedIds = { ...state.deletedIds };
      delete nextDeletedIds[action.member.id];

      const defaultQuery: MembersQueryState = {
        page: 1,
        limit: state.activeQuery.limit || 10,
        search: '',
        filters: DEFAULT_MEMBER_FILTERS,
      };
      const defaultKey = buildMembersQueryKey(defaultQuery);
      const existingPage1 = state.pagesByKey[defaultKey];
      const nextPages = { ...state.pagesByKey };

      if (existingPage1) {
        const dedupedIds = existingPage1.ids.filter((id) => id !== action.member.id);
        const nextIds = [action.member.id, ...dedupedIds].slice(0, existingPage1.limit);
        const nextTotal = existingPage1.total + (existingPage1.ids.includes(action.member.id) ? 0 : 1);
        nextPages[defaultKey] = {
          ...existingPage1,
          ids: nextIds,
          total: nextTotal,
          totalPages: Math.max(1, Math.ceil(nextTotal / existingPage1.limit)),
          version: nextVersion,
        };
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [action.member.id]: action.member,
        },
        deletedIds: nextDeletedIds,
        createdRecords: {
          ...state.createdRecords,
          [action.member.id]: {
            member: action.member,
            version: nextVersion,
            createdAt: action.now,
          },
        },
        pagesByKey: nextPages,
        activeQuery: defaultQuery,
        joinedFromField: DEFAULT_DATE_BOUND_FIELD,
        joinedToField: DEFAULT_DATE_BOUND_FIELD,
        mutationVersion: nextVersion,
        needsRevalidation: true,
      };
    }

    case 'MEMBER_UPDATED': {
      const nextVersion = state.mutationVersion + 1;
      const merged: Member = {
        ...(state.byId[action.member.id] ?? {}),
        ...action.member,
      };
      const nextCreated = { ...state.createdRecords };
      if (nextCreated[action.member.id]) {
        nextCreated[action.member.id] = {
          ...nextCreated[action.member.id],
          member: merged,
        };
      }

      return {
        ...state,
        byId: {
          ...state.byId,
          [action.member.id]: merged,
        },
        createdRecords: nextCreated,
        updatedRecords: {
          ...state.updatedRecords,
          [action.member.id]: {
            member: merged,
            version: nextVersion,
            updatedAt: action.now,
          },
        },
        mutationVersion: nextVersion,
        needsRevalidation: true,
      };
    }

    case 'MEMBER_DELETED': {
      const nextVersion = state.mutationVersion + 1;
      const nextById = { ...state.byId };
      delete nextById[action.id];

      const nextCreated = { ...state.createdRecords };
      delete nextCreated[action.id];

      const nextUpdated = { ...state.updatedRecords };
      delete nextUpdated[action.id];

      const nextPages: Record<string, MembersPageEntry> = {};
      for (const [key, entry] of Object.entries(state.pagesByKey)) {
        const hadId = entry.ids.includes(action.id);
        const nextIds = entry.ids.filter((id) => id !== action.id);
        const nextTotal = hadId ? Math.max(0, entry.total - 1) : entry.total;
        nextPages[key] = {
          ...entry,
          ids: nextIds,
          total: nextTotal,
          totalPages: Math.max(1, Math.ceil(nextTotal / entry.limit)),
          version: nextVersion,
        };
      }

      return {
        ...state,
        byId: nextById,
        createdRecords: nextCreated,
        updatedRecords: nextUpdated,
        deletedIds: {
          ...state.deletedIds,
          [action.id]: nextVersion,
        },
        pagesByKey: nextPages,
        mutationVersion: nextVersion,
        needsRevalidation: true,
      };
    }

    case 'BULK_MEMBERS_IMPORTED': {
      const nextVersion = state.mutationVersion + 1;
      return {
        ...state,
        pagesByKey: {},
        activeQuery: {
          page: 1,
          limit: state.activeQuery.limit || 10,
          search: '',
          filters: DEFAULT_MEMBER_FILTERS,
        },
        joinedFromField: DEFAULT_DATE_BOUND_FIELD,
        joinedToField: DEFAULT_DATE_BOUND_FIELD,
        mutationVersion: nextVersion,
        needsRevalidation: true,
      };
    }

    default:
      return state;
  }
}

function toPaginationParams(query: MembersQueryState): PaginationParams {
  return {
    page: query.page,
    limit: query.limit,
    search: query.search.trim() || undefined,
    status: query.filters.status,
    marital_status: query.filters.marital_status,
    joined_from: query.filters.joined_from,
    joined_to: query.filters.joined_to,
    joined_calendar:
      query.filters.joined_from || query.filters.joined_to
        ? query.filters.joined_calendar
        : undefined,
    sort_by: query.filters.sort_by,
    sort_order: query.filters.sort_order,
  };
}

function isAbortLikeError(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  if (error instanceof Error && error.message === 'Request canceled') return true;
  return false;
}

export interface MembersContextValue {
  state: MembersState;
  hydrateInitialPage: (initialPage: PaginatedResponse<Member> | null) => void;
  hydrateInitialMember: (member: Member | null) => void;
  setSearchInput: (search: string) => void;
  setDateBounds: (from?: CalendarDateFieldValue, to?: CalendarDateFieldValue) => void;
  fetchMembersPage: (
    patch?: Partial<MembersQueryState> & { filters?: MemberFilters },
    options?: { silent?: boolean; signal?: AbortSignal; throwOnError?: boolean },
  ) => Promise<PaginatedResponse<Member> | null>;
  fetchMemberById: (
    id: string,
    options?: { silent?: boolean; signal?: AbortSignal },
  ) => Promise<Member | null>;
  createMember: (memberData: Record<string, unknown>) => Promise<Member>;
  updateMember: (id: string, memberData: Record<string, unknown>) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  markBulkImported: () => Promise<PaginatedResponse<Member> | null>;
}

const MembersContext = createContext<MembersContextValue | undefined>(undefined);

export function MembersProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [state, dispatch] = useReducer(membersReducer, INITIAL_STATE);

  const stateRef = useRef<MembersState>(state);
  stateRef.current = state;

  const listSeqRef = useRef(0);
  const activeListAbortRef = useRef<AbortController | null>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== null &&
      prevUserIdRef.current !== nextUserId
    ) {
      activeListAbortRef.current?.abort(new axios.CanceledError('User session changed'));
      dispatch({ type: 'RESET' });
    }
    prevUserIdRef.current = nextUserId;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      activeListAbortRef.current?.abort(new axios.CanceledError('MembersProvider unmounted'));
    };
  }, []);

  const hydrateInitialPage = useCallback((initialPage: PaginatedResponse<Member> | null) => {
    if (!initialPage) return;
    dispatch({ type: 'HYDRATE_SSR_PAGE', initialPage });
  }, []);

  const hydrateInitialMember = useCallback((member: Member | null) => {
    if (!member) return;
    dispatch({ type: 'HYDRATE_SSR_MEMBER', member });
  }, []);

  const setSearchInput = useCallback((search: string) => {
    dispatch({ type: 'SET_SEARCH_INPUT', search });
  }, []);

  const setDateBounds = useCallback(
    (from?: CalendarDateFieldValue, to?: CalendarDateFieldValue) => {
      dispatch({ type: 'SET_DATE_BOUNDS', from, to });
    },
    [],
  );

  const fetchMembersPage = useCallback(
    async (
      patch?: Partial<MembersQueryState> & { filters?: MemberFilters },
      options: { silent?: boolean; signal?: AbortSignal; throwOnError?: boolean } = {},
    ): Promise<PaginatedResponse<Member> | null> => {
      const current = stateRef.current.activeQuery;
      const nextQuery: MembersQueryState = {
        page: patch?.page ?? current.page,
        limit: patch?.limit ?? current.limit,
        search: patch?.search !== undefined ? patch.search : current.search,
        filters: patch?.filters ?? current.filters,
      };
      const key = buildMembersQueryKey(nextQuery);

      activeListAbortRef.current?.abort(new axios.CanceledError('Superseded member list fetch'));
      const controller = new AbortController();
      activeListAbortRef.current = controller;

      const onExternalAbort = () => {
        controller.abort(new axios.CanceledError('Caller aborted member list fetch'));
      };
      if (options.signal) {
        if (options.signal.aborted) {
          onExternalAbort();
          return null;
        }
        options.signal.addEventListener('abort', onExternalAbort, { once: true });
      }

      const seq = ++listSeqRef.current;
      const startedAtVersion = stateRef.current.mutationVersion;
      const silent = Boolean(options.silent);

      dispatch({ type: 'FETCH_PAGE_START', key, query: nextQuery, silent });

      try {
        const result = await apiGetMembers(toPaginationParams(nextQuery), {
          signal: controller.signal,
        });
        if (seq !== listSeqRef.current || controller.signal.aborted) {
          return null;
        }
        dispatch({
          type: 'FETCH_PAGE_SUCCESS',
          key,
          query: nextQuery,
          result,
          startedAtVersion,
          fetchedAt: Date.now(),
        });
        return result;
      } catch (error: unknown) {
        if (seq !== listSeqRef.current || controller.signal.aborted || isAbortLikeError(error)) {
          return null;
        }
        dispatch({
          type: 'FETCH_PAGE_ERROR',
          error: getApiErrorMessage(error, 'Failed to load members'),
          silent,
        });
        if (options.throwOnError) {
          throw error;
        }
        return null;
      } finally {
        if (options.signal) {
          options.signal.removeEventListener('abort', onExternalAbort);
        }
        if (activeListAbortRef.current === controller) {
          activeListAbortRef.current = null;
        }
      }
    },
    [],
  );

  const fetchMemberById = useCallback(
    async (
      id: string,
      options: { silent?: boolean; signal?: AbortSignal } = {},
    ): Promise<Member | null> => {
      const silent = Boolean(options.silent);
      dispatch({ type: 'DETAIL_FETCH_START', id, silent });
      try {
        const member = await apiGetMemberById(id, { signal: options.signal });
        if (options.signal?.aborted) return null;
        dispatch({ type: 'DETAIL_FETCH_SUCCESS', member });
        return member;
      } catch (error: unknown) {
        if (options.signal?.aborted || isAbortLikeError(error)) {
          dispatch({ type: 'DETAIL_FETCH_ERROR', id });
          return null;
        }
        dispatch({ type: 'DETAIL_FETCH_ERROR', id });
        throw error;
      }
    },
    [],
  );

  const createMember = useCallback(async (memberData: Record<string, unknown>): Promise<Member> => {
    const created = await apiCreateMember(memberData);
    activeListAbortRef.current?.abort(new axios.CanceledError('Member created'));
    listSeqRef.current += 1;
    dispatch({ type: 'MEMBER_CREATED', member: created, now: Date.now() });
    return created;
  }, []);

  const updateMember = useCallback(
    async (id: string, memberData: Record<string, unknown>): Promise<Member> => {
      dispatch({ type: 'SET_MUTATING', id, active: true });
      try {
        const updated = await apiUpdateMember(id, memberData);
        activeListAbortRef.current?.abort(new axios.CanceledError('Member updated'));
        listSeqRef.current += 1;
        dispatch({ type: 'MEMBER_UPDATED', member: updated, now: Date.now() });
        return updated;
      } finally {
        dispatch({ type: 'SET_MUTATING', id, active: false });
      }
    },
    [],
  );

  const deleteMember = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'SET_MUTATING', id, active: true });
    try {
      await apiDeleteMember(id);
      activeListAbortRef.current?.abort(new axios.CanceledError('Member deleted'));
      listSeqRef.current += 1;
      dispatch({ type: 'MEMBER_DELETED', id });
    } finally {
      dispatch({ type: 'SET_MUTATING', id, active: false });
    }
  }, []);

  const markBulkImported = useCallback(async () => {
    activeListAbortRef.current?.abort(new axios.CanceledError('Bulk members imported'));
    listSeqRef.current += 1;
    dispatch({ type: 'BULK_MEMBERS_IMPORTED' });
    return fetchMembersPage(
      {
        page: 1,
        limit: stateRef.current.activeQuery.limit || 10,
        search: '',
        filters: DEFAULT_MEMBER_FILTERS,
      },
      { silent: false },
    );
  }, [fetchMembersPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleNetworkRestored = () => {
      if (stateRef.current.listError || stateRef.current.needsRevalidation) {
        void fetchMembersPage(undefined, { silent: !stateRef.current.listError });
      }
    };
    window.addEventListener(NETWORK_EVENT.RESTORED, handleNetworkRestored);
    return () => {
      window.removeEventListener(NETWORK_EVENT.RESTORED, handleNetworkRestored);
    };
  }, [fetchMembersPage]);

  return (
    <MembersContext.Provider
      value={{
        state,
        hydrateInitialPage,
        hydrateInitialMember,
        setSearchInput,
        setDateBounds,
        fetchMembersPage,
        fetchMemberById,
        createMember,
        updateMember,
        deleteMember,
        markBulkImported,
      }}
    >
      {children}
    </MembersContext.Provider>
  );
}

export function useMembers(): MembersContextValue {
  const ctx = useContext(MembersContext);
  if (!ctx) {
    throw new Error('useMembers must be used within a MembersProvider');
  }
  return ctx;
}
