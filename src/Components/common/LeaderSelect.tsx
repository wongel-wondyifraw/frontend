'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, Tag, Space } from 'antd';
import { getMembers, getMinisters } from '@/services/api';
import type { LeaderType, Member, Minister } from '@/types';
import { useDebouncedCallback } from '@/lib/debounce';

export type LeaderSelectValue = {
  leader_id: string | null;
  leader_type: LeaderType | null;
};

type Candidate = {
  key: string;
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  type: LeaderType;
};

export type LeaderCandidate = Candidate;

export function displayName(c: Pick<Candidate, 'first_name' | 'middle_name' | 'last_name'>) {
  return `${c.first_name} ${c.middle_name ? `${c.middle_name} ` : ''}${c.last_name}`.trim();
}

export function encodeLeaderValue(leaderId?: string | null, leaderType?: LeaderType | null): string | undefined {
  if (!leaderId) return undefined;
  return `${leaderType || 'member'}:${leaderId}`;
}

export function decodeLeaderValue(value?: string | null): LeaderSelectValue {
  if (!value) return { leader_id: null, leader_type: null };
  const [type, ...rest] = value.split(':');
  const id = rest.join(':');
  if ((type !== 'member' && type !== 'minister') || !id) {
    return { leader_id: null, leader_type: null };
  }
  return { leader_id: id, leader_type: type };
}

interface LeaderSelectProps {
  value?: string;
  onChange?: (value: string | undefined, candidate?: LeaderCandidate) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  allowClear?: boolean;
}

const LeaderSelect = ({
  value,
  onChange,
  placeholder = 'Type to search members or ministers',
  size = 'large',
  allowClear = true,
}: LeaderSelectProps) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const term = q.trim();
      const [membersPage, ministersPage] = await Promise.all([
        getMembers({ page: 1, limit: 20, search: term || undefined }),
        getMinisters({ page: 1, limit: 20, search: term || undefined }),
      ]);
      const memberCandidates: Candidate[] = membersPage.data.map((m: Member) => ({
        key: `member:${m.id}`,
        id: m.id,
        first_name: m.first_name,
        middle_name: m.middle_name,
        last_name: m.last_name,
        email: m.email,
        type: 'member',
      }));
      const ministerCandidates: Candidate[] = ministersPage.data.map((m: Minister) => ({
        key: `minister:${m.id}`,
        id: m.id,
        first_name: m.first_name,
        middle_name: m.middle_name,
        last_name: m.last_name,
        email: m.email,
        type: 'minister',
      }));
      setCandidates([...memberCandidates, ...ministerCandidates]);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    void search(q);
  }, 300);

  useEffect(() => {
    void search('');
  }, [search]);

  const options = useMemo(
    () =>
      candidates.map((c) => ({
        value: c.key,
        label: (
          <Space size={8}>
            <span>{displayName(c)}</span>
            <Tag color={c.type === 'minister' ? 'purple' : 'blue'} style={{ marginInlineEnd: 0 }}>
              {c.type === 'minister' ? 'Minister' : 'Member'}
            </Tag>
          </Space>
        ),
        searchText: `${displayName(c)} ${c.email || ''} ${c.type}`,
      })),
    [candidates],
  );

  return (
    <Select
      showSearch
      filterOption={false}
      allowClear={allowClear}
      size={size}
      placeholder={placeholder}
      value={value}
      options={options}
      loading={loading}
      onSearch={(q) => debouncedSearch(q)}
      onChange={(next) => {
        const chosen = candidates.find((c) => c.key === next);
        onChange?.(next, chosen);
      }}
      optionLabelProp="label"
      notFoundContent={loading ? 'Searching…' : 'Type to search members or ministers'}
      style={{ width: '100%' }}
    />
  );
};

export default LeaderSelect;
