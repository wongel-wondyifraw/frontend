'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '../../Components/common/TableRowActions';
import EntityNameCell from '../../Components/common/EntityNameCell';
import { getMinistries, deleteMinistry } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMinistriesProps, Ministry } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './ManageMinistries.css';

const ManageMinistriesContent = ({ initialPage = null }: ManageMinistriesProps) => {
    const router = useRouter();
    const canCreate = useCan('ministries.create');
    const canUpdate = useCan('ministries.update');
    const canDelete = useCan('ministries.delete');
    const [ministries, setMinistries] = useState<Ministry[]>(initialPage?.data ?? []);
    const [loading, setLoading] = useState(initialPage === null);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(initialPage?.page ?? 1);
    const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
    const [total, setTotal] = useState(initialPage?.total ?? 0);

    const loadMinistries = useCallback(async (nextPage = page, nextPageSize = pageSize, search = searchText) => {
        try {
            setLoading(true);
            const result = await getMinistries({ page: nextPage, limit: nextPageSize, search: search || undefined });
            setMinistries(result.data);
            setTotal(result.total);
            setPage(result.page);
            setPageSize(result.limit);
        } catch {
            message.error('Failed to load ministries');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchText]);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        loadMinistries(1, pageSize, value);
    }, 300);

    useEffect(() => {
        if (initialPage !== null) return;
        loadMinistries();
    }, [initialPage, loadMinistries]);

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        debouncedSearch(value);
    };

    const handleDelete = (ministry: Ministry) => {
        Modal.confirm({
            title: 'Delete Ministry?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete "${ministry.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMinistry(ministry.id);
                    message.success('Ministry deleted successfully');
                    loadMinistries(page, pageSize, searchText);
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to delete ministry'));
                }
            },
        });
    };

    const columns: ColumnsType<Ministry> = [
        {
            title: 'Ministry',
            key: 'name',
            render: (_: unknown, record: Ministry) => (
                <EntityNameCell
                    title={record.name}
                    subtitle={record.schedule || undefined}
                    initials={(record.name || '?').charAt(0).toUpperCase()}
                />
            ),
        },
        {
            title: 'Leader',
            key: 'leader',
            responsive: ['md'],
            render: (_: unknown, record: Ministry) => (
                record.leader ? <LeaderNameWithTag leader={record.leader} /> : '-'
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['lg'],
            render: (date: string | undefined) => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            ...TABLE_ACTIONS_COLUMN,
            render: (_: unknown, record: Ministry) => (
                <TableRowActions
                    ariaLabel={`Actions for ${record.name}`}
                    items={[
                        {
                            key: 'view',
                            label: 'View details',
                            icon: <InfoCircleOutlined style={{ color: '#1565c0' }} />,
                            onClick: () => router.push(`/ministries/details/${record.id}`),
                        },
                        ...(canUpdate
                            ? [{
                                key: 'edit',
                                label: 'Edit',
                                icon: <EditOutlined />,
                                onClick: () => router.push(`/ministries/edit/${record.id}`),
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

    return (
        <div className="manage-page">
            <DataTable
                title="Manage Ministries"
                subtitle="Organize ministries and keep leaders and members aligned."
                columns={columns}
                dataSource={ministries}
                loading={loading}
                rowKey="id"
                searchPlaceholder="Search ministries..."
                searchValue={searchText}
                onSearchChange={handleSearchChange}
                serverPagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: (nextPage, nextPageSize) => loadMinistries(nextPage, nextPageSize, searchText),
                }}
                actionButton={canCreate ? {
                    label: 'Add Ministry',
                    icon: <PlusOutlined />,
                    onClick: () => router.push('/ministries/add'),
                } : undefined}
                tableCardClassName="data-table-card"
            />
        </div>
    );
};

const ManageMinistries = (props: ManageMinistriesProps) => (
    <PermissionGate permission="ministries.read" pageLabel="Ministries">
        <ManageMinistriesContent {...props} />
    </PermissionGate>
);

export default ManageMinistries;
