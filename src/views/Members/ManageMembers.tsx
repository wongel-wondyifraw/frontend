'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DataTable from '../../Components/common/DataTable';
import { getMembers, deleteMember, updateMember } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMembersProps, Member } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { getImageUrl } from '@/lib/media-url';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import './ManageMembers.css';

const ManageMembersContent = ({ initialPage = null }: ManageMembersProps) => {
    const router = useRouter();
    const canCreate = useCan('members.create');
    const canUpdate = useCan('members.update');
    const canDelete = useCan('members.delete');
    const canApprove = useCan('members.approve');
    const [members, setMembers] = useState<Member[]>(initialPage?.data ?? []);
    const [loading, setLoading] = useState(initialPage === null);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(initialPage?.page ?? 1);
    const [pageSize, setPageSize] = useState(initialPage?.limit ?? 10);
    const [total, setTotal] = useState(initialPage?.total ?? 0);

    const loadMembers = useCallback(async (nextPage = page, nextPageSize = pageSize, search = searchText) => {
        try {
            setLoading(true);
            const result = await getMembers({ page: nextPage, limit: nextPageSize, search: search || undefined });
            setMembers(result.data);
            setTotal(result.total);
            setPage(result.page);
            setPageSize(result.limit);
        } catch {
            message.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchText]);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        loadMembers(1, pageSize, value);
    }, 300);

    useEffect(() => {
        if (initialPage !== null) return;
        loadMembers();
    }, [initialPage, loadMembers]);

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        debouncedSearch(value);
    };

    const handleDelete = (member: Member) => {
        Modal.confirm({
            title: 'Delete Member?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteMember(member.id);
                    message.success('Member deleted successfully');
                    loadMembers(page, pageSize, searchText);
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to delete member'));
                }
            },
        });
    };

    const handleApprove = async (member: Member) => {
        try {
            await updateMember(member.id, { status: 'active' });
            message.success('Member approved successfully');
            loadMembers(page, pageSize, searchText);
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to approve member'));
        }
    };

    const handleReject = async (member: Member) => {
        try {
            await updateMember(member.id, { status: 'rejected' });
            message.success('Member rejected');
            loadMembers(page, pageSize, searchText);
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to reject member'));
        }
    };

    const columns: ColumnsType<Member> = [
        {
            title: 'Name',
            key: 'name',
            render: (_: unknown, record: Member) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                        icon={<UserOutlined />}
                        src={getImageUrl(record.image_url)}
                        style={{ backgroundColor: '#1565c0' }}
                        crossOrigin="use-credentials"
                    />
                    <div>
                        <span style={{ fontWeight: 600 }}>
                            {record.first_name} {record.middle_name ? record.middle_name + ' ' : ''}{record.last_name}
                        </span>
                        {record.email && (
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.email}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone: string | undefined) => phone || '-',
        },
        {
            title: 'Marital Status',
            dataIndex: 'marital_status',
            key: 'marital_status',
            render: (status: string | undefined) => {
                if (!status) return '-';
                const colorMap: Record<string, string> = {
                    single: '#3B82F6',
                    married: '#10b981',
                    divorced: '#f59e0b',
                    widowed: '#8b5cf6',
                };
                const color = colorMap[status.toLowerCase()] || '#94A3B8';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 10px', fontWeight: 500 }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status: string | undefined) => {
                const s = (status || 'active').toLowerCase();
                let color = '#94A3B8';
                if (s === 'active') color = '#10b981';
                else if (s === 'pending') color = '#f59e0b';
                else if (s === 'rejected') color = '#ef4444';
                else if (s === 'inactive') color = '#ef4444';

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
            render: (date: string | undefined) => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Member) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="View Details">
                        <Button
                            icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                            onClick={() => router.push(`/members/details/${record.id}`)}
                        />
                    </Tooltip>
                    
                    {record.status === 'pending' && canApprove && (
                        <>
                            <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
                            <Tooltip title="Approve">
                                <Button
                                    type="text"
                                    size="small"
                                    style={{ color: '#10b981' }}
                                    onClick={() => handleApprove(record)}
                                >
                                    Approve
                                </Button>
                            </Tooltip>
                            <Tooltip title="Reject">
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    onClick={() => handleReject(record)}
                                >
                                    Reject
                                </Button>
                            </Tooltip>
                        </>
                    )}

                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
                    {canUpdate && (
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => router.push(`/members/edit/${record.id}`)}
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
                title="Manage Members"
                columns={columns}
                dataSource={members}
                loading={loading}
                rowKey="id"
                searchPlaceholder="Search members..."
                searchValue={searchText}
                onSearchChange={handleSearchChange}
                serverPagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: (nextPage, nextPageSize) => loadMembers(nextPage, nextPageSize, searchText),
                }}
                actionButton={canCreate ? {
                    label: 'Add Member',
                    icon: <PlusOutlined />,
                    onClick: () => router.push('/members/add'),
                } : undefined}
                tableCardClassName="members-table-card"
            />
        </div>
    );
};

const ManageMembers = (props: ManageMembersProps) => (
    <PermissionGate permission="members.read" pageLabel="Members">
        <ManageMembersContent {...props} />
    </PermissionGate>
);

export default ManageMembers;
