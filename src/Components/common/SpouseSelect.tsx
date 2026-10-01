'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, Tag, Space } from 'antd';
import { getMembers, getMinisters } from '@/services/api';
import type { LeaderType, Member, Minister } from '@/types';
import { useDebouncedCallback } from '@/lib/debounce';
import {
  encodeLeaderValue,
  decodeLeaderValue,
  type LeaderSelectValue,
} from './LeaderSelect';

export { encodeLeaderValue, decodeLeaderValue };
export type { LeaderSelectValue };

type Candidate = {
  key: string;
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  gender?: string | null;
  type: LeaderType;
};

function displayName(c: Pick<Candidate, 'first_name' | 'middle_name' | 'last_name'>) {
  return `${c.first_name} ${c.middle_name ? `${c.middle_name} ` : ''}${c.last_name}`.trim();
}

interface SpouseSelectProps {
  gender: 'male' | 'female';
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  allowClear?: boolean;
}

const SpouseSelect = ({
  gender,
  value,
  onChange,
  placeholder,
  size = 'large',
  allowClear = true,
}: SpouseSelectProps) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const term = q.trim();
        const wanted = gender.toLowerCase();
        const [membersPage, ministersPage] = await Promise.all([
          getMembers({ page: 1, limit: 40, search: term || undefined }),
          getMinisters({ page: 1, limit: 40, search: term || undefined }),
        ]);
        const memberCandidates: Candidate[] = membersPage.data
          .filter((m: Member) => (m.gender || '').toLowerCase() === wanted)
          .map((m: Member) => ({
            key: `member:${m.id}`,
            id: m.id,
            first_name: m.first_name,
            middle_name: m.middle_name,
            last_name: m.last_name,
            email: m.email,
            gender: m.gender,
            type: 'member',
          }));
        const ministerCandidates: Candidate[] = ministersPage.data
          .filter((m: Minister) => (m.gender || '').toLowerCase() === wanted)
          .map((m: Minister) => ({
            key: `minister:${m.id}`,
            id: m.id,
            first_name: m.first_name,
            middle_name: m.middle_name,
            last_name: m.last_name,
            email: m.email,
            gender: m.gender,
            type: 'minister',
          }));
        setCandidates([...memberCandidates, ...ministerCandidates]);
      } catch {
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    },
    [gender],
  );

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
      })),
    [candidates],
  );

  return (
    <Select
      showSearch
      filterOption={false}
      allowClear={allowClear}
      size={size}
      placeholder={placeholder || (gender === 'male' ? 'Type to search husband' : 'Type to search wife')}
      value={value}
      options={options}
      loading={loading}
      onSearch={(q) => debouncedSearch(q)}
      onChange={(next) => onChange?.(next)}
      optionLabelProp="label"
      notFoundContent={
        loading ? 'Searching…' : `Type to search ${gender} members or ministers`
      }
      style={{ width: '100%' }}
    />
  );
};

export default SpouseSelect;
