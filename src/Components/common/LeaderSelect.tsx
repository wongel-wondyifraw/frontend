'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select, Tag, Space, Spin } from 'antd';
import { getMembersList, getMinisters } from '@/services/api';
import type { LeaderType, Member, Minister } from '@/types';

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

function displayName(c: Pick<Candidate, 'first_name' | 'middle_name' | 'last_name'>) {
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
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  allowClear?: boolean;
}

const LeaderSelect = ({
  value,
  onChange,
  placeholder = 'Select a member or minister as leader',
  size = 'large',
  allowClear = true,
}: LeaderSelectProps) => {
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
        const memberCandidates: Candidate[] = members.map((m: Member) => ({
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
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      placeholder={placeholder}
      value={value}
      options={options}
      optionFilterProp="searchText"
      filterOption={(input, option) =>
        String(option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
      }
      onChange={(next) => onChange?.(next)}
      optionLabelProp="label"
      style={{ width: '100%' }}
    />
  );
};

export default LeaderSelect;
