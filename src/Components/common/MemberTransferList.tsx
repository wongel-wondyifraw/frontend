'use client';

import React, { useMemo, useState } from 'react';
import { Avatar, Checkbox, Empty, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Member } from '@/types';
import { getImageUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import './MemberTransferList.css';

interface MemberTransferListProps {
  members?: Member[];
  selectedKeys?: string[];
  onChange: (targetKeys: string[]) => void;
  /** Kept for API compatibility; second title unused in checkbox UI */
  titles?: [string, string];
  listHeight?: number;
  description?: string;
}

function memberLabel(m: Member): string {
  return `${m.first_name} ${m.middle_name ? `${m.middle_name} ` : ''}${m.last_name}`.trim();
}

/**
 * Mobile-friendly searchable checkbox list for picking members.
 * Replaces the dual-pane Transfer control in wizard steppers.
 */
const MemberTransferList = ({
  members = [],
  selectedKeys = [],
  onChange,
  listHeight = 320,
  description = 'Search and check members to include them.',
}: MemberTransferListProps) => {
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = [
        m.first_name,
        m.middle_name,
        m.last_name,
        m.email,
        m.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, query]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedSet.has(m.id));
  const someFilteredSelected =
    filtered.some((m) => selectedSet.has(m.id)) && !allFilteredSelected;

  const toggleOne = (id: string, checked: boolean) => {
    if (checked) {
      if (selectedSet.has(id)) return;
      onChange([...selectedKeys, id]);
      return;
    }
    onChange(selectedKeys.filter((k) => k !== id));
  };

  const toggleAllFiltered = (checked: boolean) => {
    const filteredIds = filtered.map((m) => m.id);
    if (checked) {
      const next = new Set(selectedKeys);
      filteredIds.forEach((id) => next.add(id));
      onChange(Array.from(next));
      return;
    }
    const drop = new Set(filteredIds);
    onChange(selectedKeys.filter((id) => !drop.has(id)));
  };

  return (
    <div className="member-check-list">
      {description ? <p className="member-check-list-desc">{description}</p> : null}

      <Input
        className="member-check-list-search"
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search members by name, email, or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="member-check-list-toolbar">
        <Checkbox
          checked={allFilteredSelected}
          indeterminate={someFilteredSelected}
          disabled={filtered.length === 0}
          onChange={(e) => toggleAllFiltered(e.target.checked)}
        >
          {query.trim() ? 'Select all results' : 'Select all'}
        </Checkbox>
        <span className="member-check-list-count">
          {selectedKeys.length} selected
          {members.length ? ` · ${members.length} total` : ''}
        </span>
      </div>

      <div className="member-check-list-body" style={{ maxHeight: listHeight }}>
        {filtered.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={query.trim() ? 'No members match your search' : 'No members available'}
          />
        ) : (
          <ul className="member-check-list-items">
            {filtered.map((m) => {
              const checked = selectedSet.has(m.id);
              const name = memberLabel(m);
              const subtitle = m.email || m.phone || '';
              return (
                <li key={m.id} className={`member-check-list-item${checked ? ' is-selected' : ''}`}>
                  <Checkbox
                    checked={checked}
                    onChange={(e) => toggleOne(m.id, e.target.checked)}
                  >
                    <span className="member-check-list-row">
                      <Avatar
                        size={36}
                        src={getImageUrl(m.image_url) || undefined}
                        style={{ backgroundColor: '#1565c0', color: '#fff', fontWeight: 600 }}
                        crossOrigin="use-credentials"
                      >
                        {getInitials(m.first_name, m.last_name, m.middle_name)}
                      </Avatar>
                      <span className="member-check-list-text">
                        <span className="member-check-list-name">{name}</span>
                        {subtitle ? (
                          <span className="member-check-list-sub">{subtitle}</span>
                        ) : null}
                      </span>
                    </span>
                  </Checkbox>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MemberTransferList;
