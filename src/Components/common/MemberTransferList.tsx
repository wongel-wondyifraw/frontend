'use client';
import React from 'react';
import { Transfer } from 'antd';
import type { Member } from '@/types';

interface MemberTransferListProps {
  members?: Member[];
  selectedKeys?: string[];
  onChange: (targetKeys: string[]) => void;
  titles?: [string, string];
  listHeight?: number;
  description?: string;
}

const MemberTransferList = ({
  members = [],
  selectedKeys = [],
  onChange,
  titles = ['Available Members', 'Selected Members'],
  listHeight = 320,
  description,
}: MemberTransferListProps) => {
  const dataSource = members.map(m => ({
    key: m.id,
    title: `${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`,
    description: m.email || m.phone || '',
  }));

  return (
    <>
      {description && (
        <p style={{ color: '#64748b', marginBottom: '16px' }}>
          {description}
        </p>
      )}
      <Transfer
        dataSource={dataSource}
        targetKeys={selectedKeys}
        onChange={(keys) => onChange(keys as string[])}
        render={item => item.title}
        showSearch
        filterOption={(inputValue, option) =>
          option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
          option.description.toLowerCase().includes(inputValue.toLowerCase())
        }
        styles={{ section: { width: '100%', height: listHeight } }}
        titles={titles}
        style={{ width: '100%' }}
      />
      <div style={{ marginTop: '12px', color: '#64748b', fontSize: '12px' }}>
        {selectedKeys.length} member(s) selected
      </div>
    </>
  );
};

export default MemberTransferList;
