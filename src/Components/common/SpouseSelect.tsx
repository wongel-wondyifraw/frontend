'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select, Tag, Space, Spin } from 'antd';
import { getMembersList, getMinisters } from '@/services/api';
import type { LeaderType, Member, Minister } from '@/types';
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
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [members, ministersPage] = await Promise.all([
          getMembersList(),
          getMinisters({ page: 1, limit: 100 }),
        ]);
        if (cancelled) return;
        const wanted = gender.toLowerCase();
        const memberCandidates: Candidate[] = members
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
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gender]);

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

  if (loading) {
    return <Spin size="small" />;
  }

  return (
    <Select
      showSearch
      allowClear={allowClear}
      size={size}
      placeholder={placeholder || (gender === 'male' ? 'Select husband' : 'Select wife')}
      value={value}
      options={options}
      optionFilterProp="searchText"
      filterOption={(input, option) =>
        String(option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
      }
      onChange={(next) => onChange?.(next)}
      optionLabelProp="label"
      style={{ width: '100%' }}
      notFoundContent={`No ${gender} members or ministers found`}
    />
  );
};

export default SpouseSelect;
