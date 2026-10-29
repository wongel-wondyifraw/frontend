'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Tooltip,
  Typography,
  Popconfirm,
  Card,
  Empty,
  Spin,
  Pagination,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { message } from '@/lib/app-message';
import type { ContactRequestItem, ContactRequestStatus } from '@/types';
import {
  getContactRequests,
  updateContactRequest,
  deleteContactRequest,
} from '@/services/api';
import DataTableFilterPopup from '@/Components/common/DataTableFilterPopup';
import RequestDetailModal from './RequestDetailModal';
import './PrayerRequestsTab.css';

const { Text } = Typography;

interface PrayerRequestsTabProps {
  onCountChange?: (count: number) => void;
}

const CATEGORY_TAGS: Record<string, { label: string; color: string }> = {
  prayer: { label: 'Prayer Request', color: 'purple' },
  counseling: { label: 'Counseling', color: 'blue' },
  baptism: { label: 'Baptism', color: 'cyan' },
  cell: { label: 'Home Group', color: 'green' },
  chms: { label: 'ChMS System', color: 'orange' },
  general: { label: 'General Inquiry', color: 'default' },
};

const STATUS_TAGS: Record<ContactRequestStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'error' },
  read: { label: 'Read', color: 'processing' },
  in_progress: { label: 'In Progress', color: 'warning' },
  responded: { label: 'Done', color: 'success' },
  archived: { label: 'Archived', color: 'default' },
};

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PrayerRequestsTab({ onCountChange }: PrayerRequestsTabProps) {
  const [requests, setRequests] = useState<ContactRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalRequest, setActiveModalRequest] = useState<ContactRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);

  // Mobile pagination
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 8;

  const fetchRequests = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const data = await getContactRequests();
      setRequests(data);
      const newItems = data.filter((item) => item.status === 'new');
      onCountChange?.(newItems.length);
    } catch {
      if (!isSilent) {
        message.error('Failed to load prayer requests and messages');
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [onCountChange]);

  // Initial load and automatic background polling & focus revalidation
  useEffect(() => {
    fetchRequests(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    };

    const handleFocus = () => {
      fetchRequests(true);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Automatic silent polling every 12 seconds
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchRequests(true);
      }
    }, 12000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [fetchRequests]);

  const handleMarkAsDone = async (record: ContactRequestItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setMarkingDoneId(record.id);
      const updated = await updateContactRequest(record.id, {
        status: 'responded',
        responded_at: new Date().toISOString(),
      });
      message.success(`Marked request from ${record.full_name} as done`);
      setRequests((prev) =>
        prev.map((item) => (item.id === record.id ? updated : item)),
      );
      const updatedList = requests.map((item) => (item.id === record.id ? updated : item));
      onCountChange?.(updatedList.filter((item) => item.status === 'new').length);
    } catch {
      message.error('Failed to mark as done');
    } finally {
      setMarkingDoneId(null);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await deleteContactRequest(id);
      message.success('Request deleted');
      setRequests((prev) => prev.filter((item) => item.id !== id));
      const remaining = requests.filter((item) => item.id !== id);
      onCountChange?.(remaining.filter((item) => item.status === 'new').length);
    } catch {
      message.error('Failed to delete request');
    }
  };

  const handleItemUpdated = (updated: ContactRequestItem) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setActiveModalRequest(updated);
    const updatedList = requests.map((item) => (item.id === updated.id ? updated : item));
    onCountChange?.(updatedList.filter((item) => item.status === 'new').length);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'new' && item.status !== 'new') return false;
        if (selectedStatus === 'in_progress' && item.status !== 'in_progress') return false;
        if (selectedStatus === 'responded' && item.status !== 'responded') return false;
        if (selectedStatus === 'archived' && item.status !== 'archived') return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.full_name.toLowerCase().includes(q);
        const phoneMatch = item.phone.toLowerCase().includes(q);
        const emailMatch = (item.email || '').toLowerCase().includes(q);
        const messageMatch = item.message.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !emailMatch && !messageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, selectedStatus, selectedCategory, searchQuery]);

  const countSummary = useMemo(() => {
    return {
      all: requests.length,
      new: requests.filter((r) => r.status === 'new').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      responded: requests.filter((r) => r.status === 'responded').length,
    };
  }, [requests]);

  const activeFilterCount =
    (selectedStatus !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setMobilePage(1);
  };

  const filterPanel = (
    <DataTableFilterPopup
      activeCount={activeFilterCount}
      onClear={clearFilters}
      label="Filters"
    >
      <div className="dt-filter-field">
        <span className="dt-filter-label">Status</span>
        <Select
          value={selectedStatus}
          onChange={(val) => {
            setSelectedStatus(val);
            setMobilePage(1);
          }}
          options={[
            { value: 'all', label: `All Statuses (${countSummary.all})` },
            { value: 'new', label: `New / Unread (${countSummary.new})` },
            { value: 'in_progress', label: `In Progress (${countSummary.in_progress})` },
            { value: 'responded', label: `Done (${countSummary.responded})` },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      <div className="dt-filter-field">
        <span className="dt-filter-label">Category</span>
        <Select
          value={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val);
            setMobilePage(1);
          }}
          options={[
            { value: 'all', label: 'All Categories' },
            { value: 'prayer', label: 'Pastoral Prayer Requests' },
            { value: 'counseling', label: 'Counseling Needs' },
            { value: 'baptism', label: 'Water Baptism & Class' },
            { value: 'cell', label: 'Home & Cell Groups' },
            { value: 'chms', label: 'ChMS System Inquiries' },
            { value: 'general', label: 'General Messages' },
          ]}
        />
      </div>
    </DataTableFilterPopup>
  );

  // Paginated requests for mobile card feed
  const paginatedMobileRequests = useMemo(() => {
    const start = (mobilePage - 1) * mobilePageSize;
    return filteredRequests.slice(start, start + mobilePageSize);
  }, [filteredRequests, mobilePage]);

  const columns: ColumnsType<ContactRequestItem> = [
    {
      title: 'Sender / Contact',
      key: 'sender',
      width: 220,
      render: (_, record) => (
        <div className="pr-sender-cell">
          <div className="pr-sender-name-row">
            <span className="pr-sender-name">{record.full_name}</span>
            {record.is_confidential && (
              <Tooltip title="Confidential — Strictly Senior Pastors Only">
                <Tag color="volcano" icon={<SafetyCertificateOutlined />} className="pr-confidential-pill">
                  Confidential
                </Tag>
              </Tooltip>
            )}
          </div>
          <div className="pr-sender-links">
            <a
              href={`tel:${record.phone}`}
              className="pr-contact-link"
              onClick={(e) => e.stopPropagation()}
            >
              <PhoneOutlined /> {record.phone}
            </a>
            {record.email && (
              <a
                href={`mailto:${record.email}`}
                className="pr-contact-link"
                onClick={(e) => e.stopPropagation()}
              >
                <MailOutlined /> {record.email}
              </a>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => {
        const meta = CATEGORY_TAGS[category] || { label: category, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Message / Need',
      dataIndex: 'message',
      key: 'message',
      render: (text: string, record) => (
        <div className="pr-message-cell">
          <p className="pr-message-text">{text}</p>
          {record.notes && (
            <div className="pr-notes-preview">
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Pastoral note:</strong> {record.notes}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Received',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (iso: string) => (
        <Tooltip title={new Date(iso).toLocaleString()}>
          <span className="pr-time-label">{formatTimeAgo(iso)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: ContactRequestStatus) => {
        const meta = STATUS_TAGS[status] || { label: status, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          {record.status !== 'responded' ? (
            <Tooltip title="Mark as Done">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: '#10B981', fontSize: 16 }} />}
                loading={markingDoneId === record.id}
                onClick={(e) => handleMarkAsDone(record, e)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Completed">
              <CheckCircleOutlined style={{ color: '#10B981', fontSize: 16, padding: '4px' }} />
            </Tooltip>
          )}

          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#1E40AF', fontSize: 15 }} />}
              onClick={() => {
                setActiveModalRequest(record);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this request?"
            description="Are you sure you want to delete this message?"
            okText="Delete"
            okType="danger"
            onConfirm={(e) => handleDelete(record.id, e)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div id="prayer-requests-section" className="pr-container">
      {/* Top Toolbar: Search & Filter Popup matching Tasks UI */}
      <div id="prayer-requests-toolbar" className="data-table-controls pr-toolbar-controls">
        <Input
          id="pr-search-filter"
          className="data-table-search pr-search-input"
          placeholder="Search sender, phone, message..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setMobilePage(1);
          }}
          allowClear
        />

        <div className="data-table-filters pr-toolbar-filters">
          {filterPanel}
        </div>
      </div>

      {/* Main Desktop Table Feed (Shown on screens >= 768px) */}
      <div className="pr-desktop-table-wrapper">
        <Table<ContactRequestItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredRequests}
          loading={loading}
          scroll={{ x: 820 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => {
              setActiveModalRequest(record);
              setIsModalOpen(true);
            },
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  selectedStatus === 'new'
                    ? 'No new unread requests. You are all caught up!'
                    : 'No requests found matching your filter.'
                }
              />
            ),
          }}
        />
      </div>

      {/* Mobile Card Feed (Shown on screens < 768px) */}
      <div className="pr-mobile-feed-wrapper">
        {loading && requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card variant="borderless" className="pr-mobile-empty-card">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                selectedStatus === 'new'
                  ? 'No new requests waiting!'
                  : 'No requests match your filter.'
              }
            />
          </Card>
        ) : (
          <div className="pr-mobile-card-list">
            {paginatedMobileRequests.map((record) => {
              const categoryMeta = CATEGORY_TAGS[record.category] || {
                label: record.category,
                color: 'default',
              };
              const statusMeta = STATUS_TAGS[record.status] || {
                label: record.status,
                color: 'default',
              };

              return (
                <div
                  key={record.id}
                  className="pr-mobile-card"
                  onClick={() => {
                    setActiveModalRequest(record);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="pr-mobile-card-header">
                    <div className="pr-mobile-card-title-row">
                      <span className="pr-mobile-card-name">{record.full_name}</span>
                      {record.is_confidential && (
                        <Tag color="volcano" icon={<SafetyCertificateOutlined />} className="pr-confidential-pill">
                          Confidential
                        </Tag>
                      )}
                    </div>
                    <div className="pr-mobile-card-meta-top">
                      <Tag color={categoryMeta.color}>{categoryMeta.label}</Tag>
                      <span className="pr-mobile-time">{formatTimeAgo(record.created_at)}</span>
                    </div>
                  </div>

                  <div className="pr-mobile-card-contacts">
                    <a
                      href={`tel:${record.phone}`}
                      className="pr-contact-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PhoneOutlined /> {record.phone}
                    </a>
                    {record.email && (
                      <a
                        href={`mailto:${record.email}`}
                        className="pr-contact-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MailOutlined /> {record.email}
                      </a>
                    )}
                  </div>

                  <p className="pr-mobile-card-message">{record.message}</p>

                  {record.notes && (
                    <div className="pr-notes-preview">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>Note:</strong> {record.notes}
                      </Text>
                    </div>
                  )}

                  <div className="pr-mobile-card-footer" onClick={(e) => e.stopPropagation()}>
                    <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                    <div className="pr-mobile-actions">
                      {record.status !== 'responded' && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          loading={markingDoneId === record.id}
                          style={{ background: '#10B981', borderColor: '#10B981', fontSize: 12 }}
                          onClick={(e) => handleMarkAsDone(record, e)}
                        >
                          Done
                        </Button>
                      )}
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setActiveModalRequest(record);
                          setIsModalOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      <Popconfirm
                        title="Delete request?"
                        description="Are you sure?"
                        okText="Delete"
                        okType="danger"
                        onConfirm={(e) => handleDelete(record.id, e)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRequests.length > mobilePageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <Pagination
                  size="small"
                  current={mobilePage}
                  total={filteredRequests.length}
                  pageSize={mobilePageSize}
                  onChange={(page) => setMobilePage(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      <RequestDetailModal
        open={isModalOpen}
        request={activeModalRequest}
        onClose={() => {
          setIsModalOpen(false);
          setActiveModalRequest(null);
        }}
        onUpdated={handleItemUpdated}
      />
    </div>
  );
}
