'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import { getMinisters, deleteMinister } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMinistersProps, Minister } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { getImageUrl } from '@/lib/media-url';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import './ManageMinisters.css';

const ManageMinistersContent = ({ initialPage = null }: ManageMinistersProps) => {
  const router = useRouter();
  const canCreate = useCan('ministers.create');
  const canUpdate = useCan('ministers.update');
  const canDelete = useCan('ministers.delete');
  const [ministers, setMinisters] = useState<Minister[]>(initialPage?.data ?? []);
  const [loading, setLoading] = useState(initialPage === null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(initialPage?.page ?? 1);
  const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
  const [total, setTotal] = useState(initialPage?.total ?? 0);

  const loadMinisters = useCallback(async (nextPage = page, nextPageSize = pageSize, search = searchText) => {
    try {
      setLoading(true);
      const result = await getMinisters({ page: nextPage, limit: nextPageSize, search: search || undefined });
      setMinisters(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load ministers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadMinisters(1, pageSize, value);
  }, 300);

  useEffect(() => {
    if (initialPage !== null) return;
    loadMinisters();
  }, [initialPage, loadMinisters]);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleDelete = (minister: Minister) => {
    Modal.confirm({
      title: 'Delete Minister?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Delete ${minister.first_name} ${minister.last_name}? Their login account will also be removed.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteMinister(minister.id);
          message.success('Minister deleted successfully');
          loadMinisters(page, pageSize, searchText);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete minister'));
        }
      },
    });
  };

  const columns: ColumnsType<Minister> = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: Minister) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            icon={<UserOutlined />}
            src={getImageUrl(record.image_url)}
            style={{ backgroundColor: '#1565c0' }}
            crossOrigin="use-credentials"
          />
          <div>
            <span style={{ fontWeight: 600 }}>
              {record.first_name} {record.middle_name ? `${record.middle_name} ` : ''}{record.last_name}
            </span>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string | undefined) => title || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | undefined) => phone || '-',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status: string | undefined) => {
        const s = (status || 'active').toLowerCase();
        const color = s === 'active' ? '#10b981' : '#ef4444';
        return (
          <Tag color={color} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
            {s.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | undefined) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Minister) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
              onClick={() => router.push(`/ministers/details/${record.id}`)}
            />
          </Tooltip>
          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
          {canUpdate && (
            <Tooltip title="Edit">
              <Button
                icon={<EditOutlined />}
                type="text"
                size="small"
                onClick={() => router.push(`/ministers/edit/${record.id}`)}
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
    <div className="manage-members-container">
      <DataTable
        title="Manage Ministers"
        columns={columns}
        dataSource={ministers}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search ministers..."
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        serverPagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => loadMinisters(nextPage, nextPageSize, searchText),
        }}
        actionButton={canCreate ? {
          label: 'Register Minister',
          icon: <PlusOutlined />,
          onClick: () => router.push('/ministers/add'),
        } : undefined}
        tableCardClassName="members-table-card"
      />
    </div>
  );
};

const ManageMinisters = (props: ManageMinistersProps) => (
  <PermissionGate permission="ministers.read" pageLabel="Ministers">
    <ManageMinistersContent {...props} />
  </PermissionGate>
);

export default ManageMinisters;
