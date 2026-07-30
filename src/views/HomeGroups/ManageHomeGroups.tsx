'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, InfoCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import { getHomeGroups, deleteHomeGroup } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageHomeGroupsProps, HomeGroup } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './ManageHomeGroups.css';

const ManageHomeGroupsContent = ({ initialPage = null }: ManageHomeGroupsProps) => {
  const router = useRouter();
  const canCreate = useCan('home_groups.create');
  const canUpdate = useCan('home_groups.update');
  const canDelete = useCan('home_groups.delete');
  const [homeGroups, setHomeGroups] = useState<HomeGroup[]>(initialPage?.data ?? []);
  const [loading, setLoading] = useState(initialPage === null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(initialPage?.page ?? 1);
  const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
  const [total, setTotal] = useState(initialPage?.total ?? 0);

  const loadHomeGroups = useCallback(async (nextPage = page, nextPageSize = pageSize, search = searchText) => {
    try {
      setLoading(true);
      const result = await getHomeGroups({ page: nextPage, limit: nextPageSize, search: search || undefined });
      setHomeGroups(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load home groups');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadHomeGroups(1, pageSize, value);
  }, 300);

  useEffect(() => {
    if (initialPage !== null) return;
    loadHomeGroups();
  }, [initialPage, loadHomeGroups]);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleDelete = (group: HomeGroup) => {
    Modal.confirm({
      title: 'Delete Home Group?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteHomeGroup(group.id);
          message.success('Home group deleted successfully');
          loadHomeGroups(page, pageSize, searchText);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete home group'));
        }
      },
    });
  };

  const columns: ColumnsType<HomeGroup> = [
    {
      title: 'Home Group',
      key: 'name',
      render: (_: unknown, record: HomeGroup) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar icon={<HomeOutlined />} style={{ backgroundColor: '#1565c0' }} />
          <div>
            <span style={{ fontWeight: 600 }}>{record.name}</span>
            {record.schedule && (
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.schedule}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, record: HomeGroup) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <EnvironmentOutlined style={{ color: '#64748b' }} />
          {record.location || '-'}
        </span>
      ),
    },
    {
      title: 'Leader',
      key: 'leader',
      render: (_: unknown, record: HomeGroup) => (
        record.leader ? <LeaderNameWithTag leader={record.leader} /> : '-'
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | undefined) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: HomeGroup) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tooltip title="View Details">
            <Button
              icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
              onClick={() => router.push(`/members/home-groups/details/${record.id}`)}
            />
          </Tooltip>
          {canUpdate && (
            <Tooltip title="Edit">
              <Button
                icon={<EditOutlined />}
                type="text"
                size="small"
                onClick={() => router.push(`/members/home-groups/edit/${record.id}`)}
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
    <div className="manage-ministries-container">
      <DataTable
        title="Manage Home Groups"
        columns={columns}
        dataSource={homeGroups}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search home groups..."
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        serverPagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) => loadHomeGroups(nextPage, nextPageSize, searchText),
        }}
        actionButton={canCreate ? {
          label: 'Add Home Group',
          icon: <PlusOutlined />,
          onClick: () => router.push('/members/home-groups/add'),
        } : undefined}
        tableCardClassName="ministries-table-card"
      />
    </div>
  );
};

const ManageHomeGroups = (props: ManageHomeGroupsProps) => (
  <PermissionGate permission="home_groups.read" pageLabel="Home Groups">
    <ManageHomeGroupsContent {...props} />
  </PermissionGate>
);

export default ManageHomeGroups;
