'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, App, Select } from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import DataTableFilterPopup from '../../Components/common/DataTableFilterPopup';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '../../Components/common/TableRowActions';
import EntityNameCell from '../../Components/common/EntityNameCell';
import { getMinisters, deleteMinister } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMinistersProps, Minister, PaginationParams } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { getImageUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import './ManageMinisters.css';

type MinisterFilters = {
  status?: string;
};

const DEFAULT_FILTERS: MinisterFilters = {};

const ManageMinistersContent = ({ initialPage = null }: ManageMinistersProps) => {
  const router = useRouter();
  const canCreate = useCan('ministers.create');
  const canUpdate = useCan('ministers.update');
  const canDelete = useCan('ministers.delete');
  const { modal } = App.useApp();
  const [ministers, setMinisters] = useState<Minister[]>(initialPage?.data ?? []);
  const [loading, setLoading] = useState(initialPage === null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(initialPage?.page ?? 1);
  const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
  const [total, setTotal] = useState(initialPage?.total ?? 0);
  const [filters, setFilters] = useState<MinisterFilters>(DEFAULT_FILTERS);

  const loadMinisters = useCallback(async (
    nextPage = page,
    nextPageSize = pageSize,
    search = searchText,
    nextFilters = filters,
  ) => {
    try {
      setLoading(true);
      const params: PaginationParams = {
        page: nextPage,
        limit: nextPageSize,
        search: search || undefined,
        status: nextFilters.status,
      };
      const result = await getMinisters(params);
      setMinisters(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load ministers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, filters]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadMinisters(1, pageSize, value, filters);
  }, 300);

  useEffect(() => {
    if (initialPage !== null) return;
    void loadMinisters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage]);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const applyFilters = (patch: Partial<MinisterFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    loadMinisters(1, pageSize, searchText, next);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadMinisters(1, pageSize, searchText, DEFAULT_FILTERS);
  };

  const handleDelete = (minister: Minister) => {
    modal.confirm({
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
          loadMinisters(page, pageSize, searchText, filters);
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
        <EntityNameCell
          title={
            <>
              {record.first_name}{' '}
              {record.middle_name ? `${record.middle_name} ` : ''}
              {record.last_name}
            </>
          }
          subtitle={record.email || undefined}
          avatarSrc={getImageUrl(record.image_url)}
          initials={getInitials(record.first_name, record.last_name, record.middle_name)}
          meta={
            record.title ? (
              <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                {record.title}
              </Tag>
            ) : undefined
          }
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      responsive: ['md'],
      render: (title: string | undefined) => title || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      render: (phone: string | undefined) => phone || '-',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status: string | undefined) => {
        const s = (status || 'active').toLowerCase();
        let color = '#94A3B8';
        if (s === 'active') color = '#10b981';
        else if (s === 'inactive' || s === 'suspended') color = '#ef4444';
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
      responsive: ['lg'],
      render: (date: string | undefined) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: Minister) => (
        <TableRowActions
          ariaLabel={`Actions for ${record.first_name}`}
          items={[
            {
              key: 'view',
              label: 'View details',
              icon: <InfoCircleOutlined style={{ color: '#1565c0' }} />,
              onClick: () => router.push(`/ministers/details/${record.id}`),
            },
            ...(canUpdate
              ? [{
                  key: 'edit',
                  label: 'Edit',
                  icon: <EditOutlined />,
                  onClick: () => router.push(`/ministers/edit/${record.id}`),
                }]
              : []),
            ...(canDelete
              ? [{
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record),
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  const activeFilterCount = [filters.status].filter(Boolean).length;

  const filterPanel = (
    <DataTableFilterPopup activeCount={activeFilterCount} onClear={clearAllFilters}>
      <div className="dt-filter-field">
        <span className="dt-filter-label">Status</span>
        <Select
          allowClear
          placeholder="Any status"
          value={filters.status}
          onChange={(value) => applyFilters({ status: value || undefined })}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>
    </DataTableFilterPopup>
  );

  return (
    <div className="manage-page">
      <DataTable
        title="Manage Ministers"
        subtitle="Track ministers, assignments, and pastoral leadership records."
        columns={columns}
        dataSource={ministers}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search ministers..."
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        filterPanel={filterPanel}
        serverPagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextPageSize) =>
            loadMinisters(nextPage, nextPageSize, searchText, filters),
        }}
        actionButton={canCreate ? {
          label: 'Register Minister',
          icon: <PlusOutlined />,
          onClick: () => router.push('/ministers/add'),
        } : undefined}
        tableCardClassName="data-table-card"
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
