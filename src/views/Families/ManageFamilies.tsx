'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import DataTable from '../../Components/common/DataTable';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import {
  deleteFamily,
  getFamilies,
  getFamilyStats,
} from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Family, FamilyStats } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import { LeaderNameWithTag } from '../../Components/common/LeaderLabel';
import './ManageFamilies.css';

const emptyStats: FamilyStats = {
  familyCount: 0,
  childrenCount: 0,
  childrenBelow10: 0,
  childrenTeenage: 0,
  childrenAbove20: 0,
};

const ManageFamiliesContent = () => {
  const router = useRouter();
  const canCreate = useCan('families.create');
  const canUpdate = useCan('families.update');
  const canDelete = useCan('families.delete');

  const [families, setFamilies] = useState<Family[]>([]);
  const [stats, setStats] = useState<FamilyStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getFamilyStats());
    } catch {
      setStats(emptyStats);
    }
  }, []);

  const loadFamilies = useCallback(async (
    nextPage = page,
    nextPageSize = pageSize,
    search = searchText,
  ) => {
    try {
      setLoading(true);
      const result = await getFamilies({
        page: nextPage,
        limit: nextPageSize,
        search: search || undefined,
      });
      setFamilies(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load families');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadFamilies(1, pageSize, value);
  }, 300);

  const handleDeleteFamily = (family: Family) => {
    Modal.confirm({
      title: 'Delete family?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: `Delete "${family.name || 'this family'}" and all children records?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteFamily(family.id);
          message.success('Family deleted');
          await Promise.all([loadFamilies(page, pageSize, searchText), loadStats()]);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete family'));
        }
      },
    });
  };

  const columns: ColumnsType<Family> = [
    {
      title: 'Family',
      key: 'name',
      render: (_: unknown, record: Family) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1565c0' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name || 'Family'}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              {(record.children?.length ?? 0)} child{(record.children?.length ?? 0) === 1 ? '' : 'ren'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Husband',
      key: 'husband',
      render: (_: unknown, record: Family) => <LeaderNameWithTag leader={record.husband} />,
    },
    {
      title: 'Wife',
      key: 'wife',
      render: (_: unknown, record: Family) => <LeaderNameWithTag leader={record.wife} />,
    },
    {
      title: 'Children',
      key: 'children',
      render: (_: unknown, record: Family) => (
        <Space wrap size={[4, 4]}>
          {(record.children || []).length === 0 ? (
            <span style={{ color: '#94a3b8' }}>—</span>
          ) : (
            (record.children || []).slice(0, 3).map((c) => (
              <Tag key={c.id}>{c.name} ({c.age})</Tag>
            ))
          )}
          {(record.children?.length ?? 0) > 3 && (
            <Tag>+{(record.children?.length ?? 0) - 3}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_: unknown, record: Family) => (
        <Space>
          <Tooltip title="View details">
            <Button
              type="text"
              icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
              onClick={() => router.push(`/families/details/${record.id}`)}
            />
          </Tooltip>
          {canUpdate && (
            <Tooltip title="Edit family">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => router.push(`/families/edit/${record.id}`)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFamily(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="manage-ministries-container">
      <div className="manage-ministries-header">
        <h2>Family Management</h2>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/families/add')}>
            Create Family
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic title="Families" value={stats.familyCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic title="Children" value={stats.childrenCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <Card>
            <Statistic title="Below 10" value={stats.childrenBelow10} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <Card>
            <Statistic title="Teenage (10–19)" value={stats.childrenTeenage} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Statistic title="Above 20" value={stats.childrenAbove20} />
          </Card>
        </Col>
      </Row>

      <div className="ministries-table-card">
        <DataTable
          columns={columns}
          dataSource={families}
          loading={loading}
          searchPlaceholder="Search families..."
          searchValue={searchText}
          onSearchChange={(value) => {
            setSearchText(value);
            debouncedSearch(value);
          }}
          serverPagination={{
            current: page,
            pageSize,
            total,
            onChange: (nextPage, nextSize) => loadFamilies(nextPage, nextSize, searchText),
          }}
        />
      </div>
    </div>
  );
};

const ManageFamilies = () => (
  <PermissionGate permission="families.read">
    <ManageFamiliesContent />
  </PermissionGate>
);

export default ManageFamilies;
