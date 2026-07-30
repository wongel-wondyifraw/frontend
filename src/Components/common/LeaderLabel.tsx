'use client';

import { Tag } from 'antd';
import type { LeaderSummary } from '@/types';

export function leaderDisplayName(leader?: LeaderSummary | null) {
  if (!leader) return 'Not assigned';
  return `${leader.first_name} ${leader.middle_name ? `${leader.middle_name} ` : ''}${leader.last_name}`.trim();
}

export function LeaderNameWithTag({ leader }: { leader?: LeaderSummary | null }) {
  if (!leader) return <span>Not assigned</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <strong style={{ color: '#1565c0', fontWeight: 600 }}>{leaderDisplayName(leader)}</strong>
      <Tag color={leader.type === 'minister' ? 'purple' : 'blue'} style={{ marginInlineEnd: 0 }}>
        {leader.type === 'minister' ? 'Minister' : 'Member'}
      </Tag>
    </span>
  );
}
