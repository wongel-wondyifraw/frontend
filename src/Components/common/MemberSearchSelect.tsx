'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select } from 'antd';
import { getMembers } from '@/services/api';
import type { Member } from '@/types';
import { useDebouncedCallback } from '@/lib/debounce';

function memberLabel(m: Member): string {
  return `${m.first_name} ${m.middle_name ? `${m.middle_name} ` : ''}${m.last_name}`.trim();
}

type MemberSearchSelectProps = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  /** Exclude these member IDs from options */
  excludeIds?: string[];
  /** Extra label suffix builder (e.g. visit count) */
  optionExtra?: (m: Member) => string;
  sortBy?: (a: Member, b: Member) => number;
};

/**
 * Debounced remote-search Select for members (limit 20–40 per query).
 */
export default function MemberSearchSelect({
  value,
  onChange,
  placeholder = 'Type to search members',
  size = 'large',
  excludeIds,
  optionExtra,
  sortBy,
}: MemberSearchSelectProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Member[]>([]);

  // Keep references to prevent recreating callbacks on every parent re-render
  const excludeIdsKey = excludeIds ? excludeIds.join(',') : '';
  const excludeSet = useMemo(() => new Set(excludeIds || []), [excludeIdsKey]);
  const excludeRef = useRef(excludeSet);
  excludeRef.current = excludeSet;

  const sortByRef = useRef(sortBy);
  sortByRef.current = sortBy;

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const result = await getMembers({
        page: 1,
        limit: 40,
        search: q.trim() || undefined,
      });
      let data = result.data.filter((m) => !excludeRef.current.has(m.id));
      if (sortByRef.current) {
        data = data.slice().sort(sortByRef.current);
      }
      setOptions(data);
    } catch {
      setOptions([]);
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

  return (
    <Select
      showSearch
      filterOption={false}
      allowClear
      size={size}
      placeholder={placeholder}
      value={value}
      loading={loading}
      onSearch={(q) => debouncedSearch(q)}
      onChange={(next) => onChange?.(next)}
      notFoundContent={loading ? 'Searching…' : 'Type to search members'}
      options={options.map((m) => ({
        value: m.id,
        label: optionExtra ? `${memberLabel(m)}${optionExtra(m)}` : memberLabel(m),
      }))}
      style={{ width: '100%' }}
    />
  );
}
