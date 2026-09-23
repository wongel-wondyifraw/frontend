'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Avatar, Modal, Tooltip, Tag } from 'antd';
import { message } from '@/lib/app-message';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, InfoCircleOutlined,
  EnvironmentOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import { getBibleStudies, deleteBibleStudy } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageBibleStudiesProps, BibleStudy } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './ManageBibleStudies.css';

const ManageBibleStudiesContent = ({ initialPage = null }: ManageBibleStudiesProps) => {
  const router = useRouter();
  const canCreate = useCan('bible_studies.create');
  const canUpdate = useCan('bible_studies.update');
  const canDelete = useCan('bible_studies.delete');
  const [studies, setStudies] = useState<BibleStudy[]>(initialPage?.data ?? []);
  const [loading, setLoading] = useState(initialPage === null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(initialPage?.page ?? 1);
  const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
  const [total, setTotal] = useState(initialPage?.total ?? 0);

  const loadStudies = useCallback(async (nextPage = page, nextPageSize = pageSize, search = searchText) => {
    try {
      setLoading(true);
      const result = await getBibleStudies({ page: nextPage, limit: nextPageSize, search: search || undefined });
      setStudies(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load Bible studies');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadStudies(1, pageSize, value);
  }, 300);

  useEffect(() => {
    if (initialPage !== null) return;
    loadStudies();
  }, [initialPage, loadStudies]);

  const handleDelete = (study: BibleStudy) => {
    Modal.confirm({
      title: 'Delete Bible Study?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete "${study.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteBibleStudy(study.id);
          message.success('Bible study deleted successfully');
          loadStudies(page, pageSize, searchText);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete Bible study'));
        }
      },
    });
  };

  const columns: ColumnsType<BibleStudy> = [
    {
      title: 'Bible Study',
      key: 'name',
      render: (_: unknown, record: BibleStudy) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar icon={<BookOutlined />} style={{ backgroundColor: '#1565c0' }} />
          <div>
            <span style={{ fontWeight: 600 }}>{record.name}</span>
            {record.schedule && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{record.schedule}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      key: 'content',
      responsive: ['sm'],
      render: (_: unknown, record: BibleStudy) => (
        record.content_type === 'book' ? (
          <Tag icon={<BookOutlined />} color="blue">{record.bible_book || 'Book'}</Tag>
        ) : (
          <Tag icon={<FileTextOutlined />} color="purple">Study Material</Tag>
        )
      ),
    },
    {
      title: 'Location',
      key: 'location',
      responsive: ['md'],
      render: (_: unknown, record: BibleStudy) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <EnvironmentOutlined style={{ color: '#64748b' }} />
          {record.location || '-'}
        </span>
      ),
    },
    {
      title: 'Leader',
      key: 'leader',
      responsive: ['lg'],
      render: (_: unknown, record: BibleStudy) => (
        record.leader ? <LeaderNameWithTag leader={record.leader} /> : '-'
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: BibleStudy) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
              onClick={() => router.push(`/bible-study/details/${record.id}`)}
            />
          </Tooltip>
          {canUpdate && (
            <Tooltip title="Edit">
              <Button
                icon={<EditOutlined />}
                type="text"
                size="small"
                onClick={() => router.push(`/bible-study/edit/${record.id}`)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <Button
                icon={<DeleteOutlined />}
                type="text"
                danger
                size="small"
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="manage-page">
      <DataTable
        title="Manage Bible Studies"
        columns={columns}
        dataSource={studies}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search Bible studies..."
        searchValue={searchText}
        onSearchChange={(value) => {
          setSearchText(value);
          debouncedSearch(value);
        }}
        serverPagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => loadStudies(nextPage, nextPageSize, searchText),
        }}
        actionButton={canCreate ? {
          label: 'Add Bible Study',
          icon: <PlusOutlined />,
          onClick: () => router.push('/bible-study/add'),
        } : undefined}
        tableCardClassName="data-table-card"
      />
    </div>
  );
};

const ManageBibleStudies = (props: ManageBibleStudiesProps) => (
  <PermissionGate permission="bible_studies.read" pageLabel="Bible Studies">
    <ManageBibleStudiesContent {...props} />
  </PermissionGate>
);

export default ManageBibleStudies;
