'use client';

import React, { useMemo } from 'react';
import { Checkbox, Typography } from 'antd';
import type { Permission } from '@/types';

interface PermissionPickerProps {
  grouped: Record<string, Permission[]>;
  value?: string[];
  onChange?: (slugs: string[]) => void;
  disabled?: boolean;
}

const PermissionPicker = ({ grouped, value = [], onChange, disabled }: PermissionPickerProps) => {
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (slug: string, checked: boolean) => {
    if (!onChange) return;
    if (checked) {
      onChange([...value, slug]);
    } else {
      onChange(value.filter((s) => s !== slug));
    }
  };

  const toggleCategory = (category: string, checked: boolean) => {
    if (!onChange) return;
    const slugs = grouped[category]?.map((p) => p.slug) ?? [];
    if (checked) {
      onChange(Array.from(new Set([...value, ...slugs])));
    } else {
      const remove = new Set(slugs);
      onChange(value.filter((s) => !remove.has(s)));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {Object.entries(grouped).map(([category, perms]) => {
        const catSlugs = perms.map((p) => p.slug);
        const allChecked = catSlugs.length > 0 && catSlugs.every((s) => selected.has(s));
        const indeterminate = !allChecked && catSlugs.some((s) => selected.has(s));

        return (
          <div key={category} style={{ border: '1px solid var(--border-color, #f0f0f0)', borderRadius: 8, padding: 12, backgroundColor: 'var(--bg-secondary, #fafafa)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-color, #f0f0f0)' }}>
              <Checkbox
                checked={allChecked}
                indeterminate={indeterminate}
                disabled={disabled}
                onChange={(e) => toggleCategory(category, e.target.checked)}
              />
              <span style={{ fontWeight: 600 }}>{category}</span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                ({catSlugs.filter((s) => selected.has(s)).length}/{catSlugs.length})
              </Typography.Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
              {perms.map((perm) => (
                <Checkbox
                  key={perm.slug}
                  checked={selected.has(perm.slug)}
                  disabled={disabled}
                  onChange={(e) => toggle(perm.slug, e.target.checked)}
                >
                  <span style={{ fontWeight: 500 }}>{perm.name}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #8c8c8c)' }}>
                    {perm.slug}
                  </div>
                </Checkbox>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionPicker;
