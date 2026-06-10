'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import { getMinistries, deleteMinistry } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMinistriesProps, Ministry } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { debounce } from '@/lib/debounce';
import './ManageMinistries.css';

const ManageMinistries = ({ initialPage = null }: ManageMinistriesProps) => {
    const router = useRouter();
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

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            loadMinistries(1, pageSize, value);
        }, 300),
        [loadMinistries, pageSize],
    );

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1565c0' }} />
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
            title: 'Leader',
            key: 'leader',
            render: (_: unknown, record: Ministry) => {
                if (!record.leader) return '-';
                return `${record.leader.first_name} ${record.leader.last_name || ''}`.trim();
            },
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string | undefined) => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Ministry) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="View Details">
                        <Button
                            icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                            onClick={() => router.push(`/ministries/details/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => router.push(`/ministries/edit/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            size="small"
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div className="manage-ministries-container">
            <DataTable
                title="Manage Ministries"
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
                actionButton={{
                    label: 'Add Ministry',
                    icon: <PlusOutlined />,
                    onClick: () => router.push('/ministries/add'),
                }}
                tableCardClassName="ministries-table-card"
            />
        </div>
    );
};

export default ManageMinistries;
