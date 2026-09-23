'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Button, Avatar, Modal, Tooltip, Select, DatePicker } from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import DataTable from '../../Components/common/DataTable';
import DataTableFilterPopup from '../../Components/common/DataTableFilterPopup';
import { getMembers, deleteMember, updateMember } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { ManageMembersProps, Member, PaginationParams } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { getImageUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import './ManageMembers.css';

const { RangePicker } = DatePicker;

type MemberFilters = {
    status?: string;
    marital_status?: string;
    joined_from?: string;
    joined_to?: string;
    sort_by: 'created_at' | 'joined_date' | 'visit_count';
    sort_order: 'ASC' | 'DESC';
};

const DEFAULT_FILTERS: MemberFilters = {
    sort_by: 'created_at',
    sort_order: 'DESC',
};

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
    const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
    const [joinedRange, setJoinedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const loadMembers = useCallback(async (
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
                marital_status: nextFilters.marital_status,
                joined_from: nextFilters.joined_from,
                joined_to: nextFilters.joined_to,
                sort_by: nextFilters.sort_by,
                sort_order: nextFilters.sort_order,
            };
            const result = await getMembers(params);
            setMembers(result.data);
            setTotal(result.total);
            setPage(result.page);
            setPageSize(result.limit);
        } catch {
            message.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchText, filters]);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        loadMembers(1, pageSize, value, filters);
    }, 300);

    useEffect(() => {
        if (initialPage !== null) return;
        void loadMembers();
        // Initial load only; search/filters call loadMembers explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPage]);

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        debouncedSearch(value);
    };

    const applyFilters = (patch: Partial<MemberFilters>) => {
        const next = { ...filters, ...patch };
        setFilters(next);
        loadMembers(1, pageSize, searchText, next);
    };

    const handleJoinedRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        setJoinedRange(dates);
        applyFilters({
            joined_from: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
            joined_to: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
        });
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
                    loadMembers(page, pageSize, searchText, filters);
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
            loadMembers(page, pageSize, searchText, filters);
        } catch (error: unknown) {
            message.error(getApiErrorMessage(error, 'Failed to approve member'));
        }
    };

    const handleReject = async (member: Member) => {
        try {
            await updateMember(member.id, { status: 'rejected' });
            message.success('Member rejected');
            loadMembers(page, pageSize, searchText, filters);
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
                        src={getImageUrl(record.image_url) || undefined}
                        style={{ backgroundColor: '#1565c0', color: '#fff', fontWeight: 600 }}
                        crossOrigin="use-credentials"
                    >
                        {getInitials(record.first_name, record.last_name, record.middle_name)}
                    </Avatar>
                    <div>
                        <span style={{ fontWeight: 600 }}>
                            {record.first_name} {record.middle_name ? record.middle_name + ' ' : ''}{record.last_name}
                        </span>
                        {record.email && (
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.email}</div>
                        )}
                        <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {record.member_type && record.member_type !== 'existing' && (
                                <Tag style={{ marginInlineEnd: 0 }}>{record.member_type}</Tag>
                            )}
                            {record.requires_follow_up && (
                                <Tag color="orange" style={{ marginInlineEnd: 0 }}>Follow-up</Tag>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            responsive: ['md'],
            render: (phone: string | undefined) => phone || '-',
        },
        {
            title: 'Marital Status',
            dataIndex: 'marital_status',
            key: 'marital_status',
            responsive: ['lg'],
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
            title: 'Visits',
            dataIndex: 'visit_count',
            key: 'visit_count',
            width: 90,
            responsive: ['md'],
            render: (count: number | undefined) => count ?? 0,
        },
        {
            title: 'Joined',
            key: 'joined',
            responsive: ['lg'],
            render: (_: unknown, record: Member) => {
                const raw = record.joined_date || record.created_at;
                return raw ? new Date(raw).toLocaleDateString() : '-';
            },
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

    const activeFilterCount = [
        filters.status,
        filters.marital_status,
        filters.joined_from || filters.joined_to,
        filters.sort_by !== DEFAULT_FILTERS.sort_by || filters.sort_order !== DEFAULT_FILTERS.sort_order
            ? true
            : null,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setJoinedRange(null);
        setFilters(DEFAULT_FILTERS);
        loadMembers(1, pageSize, searchText, DEFAULT_FILTERS);
    };

    const filterPanel = (
        <DataTableFilterPopup
            activeCount={activeFilterCount}
            onClear={clearAllFilters}
        >
            <div className="dt-filter-field">
                <span className="dt-filter-label">Status</span>
                <Select
                    allowClear
                    placeholder="Any status"
                    value={filters.status}
                    onChange={(value) => applyFilters({ status: value || undefined })}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'rejected', label: 'Rejected' },
                    ]}
                />
            </div>
            <div className="dt-filter-field">
                <span className="dt-filter-label">Marital status</span>
                <Select
                    allowClear
                    placeholder="Any"
                    value={filters.marital_status}
                    onChange={(value) => applyFilters({ marital_status: value || undefined })}
                    options={[
                        { value: 'single', label: 'Single' },
                        { value: 'married', label: 'Married' },
                        { value: 'divorced', label: 'Divorced' },
                        { value: 'widowed', label: 'Widowed' },
                    ]}
                />
            </div>
            <div className="dt-filter-field">
                <span className="dt-filter-label">Joined date</span>
                <RangePicker
                    value={joinedRange}
                    onChange={handleJoinedRangeChange}
                    placeholder={['From', 'To']}
                    allowEmpty={[true, true]}
                    disabledDate={(current) => current && current.isAfter(dayjs(), 'day')}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="dt-filter-field">
                <span className="dt-filter-label">Sort by</span>
                <Select
                    value={`${filters.sort_by}:${filters.sort_order}`}
                    onChange={(value) => {
                        const [sort_by, sort_order] = value.split(':') as [
                            MemberFilters['sort_by'],
                            MemberFilters['sort_order'],
                        ];
                        applyFilters({ sort_by, sort_order });
                    }}
                    options={[
                        { value: 'created_at:DESC', label: 'Newest first' },
                        { value: 'joined_date:DESC', label: 'Joined (newest)' },
                        { value: 'joined_date:ASC', label: 'Joined (oldest)' },
                        { value: 'visit_count:DESC', label: 'Visits (high → low)' },
                        { value: 'visit_count:ASC', label: 'Visits (low → high)' },
                    ]}
                />
            </div>
        </DataTableFilterPopup>
    );

    return (
        <div className="manage-page">
            <DataTable
                title="Manage Members"
                columns={columns}
                dataSource={members}
                loading={loading}
                rowKey="id"
                searchPlaceholder="Search members..."
                searchValue={searchText}
                onSearchChange={handleSearchChange}
                filterPanel={filterPanel}
                serverPagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: (nextPage, nextPageSize) =>
                        loadMembers(nextPage, nextPageSize, searchText, filters),
                }}
                actionButton={canCreate ? {
                    label: 'Add Member',
                    icon: <PlusOutlined />,
                    onClick: () => router.push('/members/add'),
                } : undefined}
                tableCardClassName="data-table-card"
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
