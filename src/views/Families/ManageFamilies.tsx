'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Col,
  Modal,
  Row,
  Statistic,
  Tag,
} from 'antd';
import { message } from '@/lib/app-message';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import DataTable from '../../Components/common/DataTable';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '../../Components/common/TableRowActions';
import EntityNameCell from '../../Components/common/EntityNameCell';
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
      render: (_: unknown, record: Family) => {
        const hasHusband = Boolean(record.husband_id);
        const hasWife = Boolean(record.wife_id);
        const isSingleParent =
          hasHusband !== hasWife && record.spouse_status !== 'external';
        const singleParentTag =
          isSingleParent && hasWife && !hasHusband
            ? 'Single mom'
            : isSingleParent && hasHusband && !hasWife
              ? 'Single dad'
              : null;

        return (
          <EntityNameCell
            title={record.name || 'Family'}
            initials={(record.name || 'F').charAt(0).toUpperCase()}
            meta={
              singleParentTag ? (
                <Tag color={singleParentTag === 'Single mom' ? 'magenta' : 'blue'} style={{ marginInlineEnd: 0 }}>
                  {singleParentTag}
                </Tag>
              ) : undefined
            }
          />
        );
      },
    },
    {
      title: 'Husband',
      key: 'husband',
      responsive: ['md'],
      render: (_: unknown, record: Family) => <LeaderNameWithTag leader={record.husband} />,
    },
    {
      title: 'Wife',
      key: 'wife',
      responsive: ['md'],
      render: (_: unknown, record: Family) => <LeaderNameWithTag leader={record.wife} />,
    },
    {
      title: 'Children',
      key: 'children',
      width: 100,
      responsive: ['sm'],
      render: (_: unknown, record: Family) => {
        const count = record.children?.length ?? 0;
        return count === 0 ? (
          <span style={{ color: '#94a3b8' }}>0</span>
        ) : (
          <Tag>{count}</Tag>
        );
      },
    },
    {
      title: 'Action',
            key: 'action',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: Family) => (
        <TableRowActions
          ariaLabel={`Actions for ${record.name || 'family'}`}
          items={[
            {
              key: 'view',
              label: 'View details',
              icon: <InfoCircleOutlined style={{ color: '#1565c0' }} />,
              onClick: () => router.push(`/families/details/${record.id}`),
            },
            ...(canUpdate
              ? [{
                  key: 'edit',
                  label: 'Edit',
                  icon: <EditOutlined />,
                  onClick: () => router.push(`/families/edit/${record.id}`),
                }]
              : []),
            ...(canDelete
              ? [{
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteFamily(record),
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="manage-page">
      <Row className="manage-page-stats" gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12} lg={8} xl={4}>
          <Card size="small">
            <Statistic title="Families" value={stats.familyCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={8} xl={4}>
          <Card size="small">
            <Statistic title="Children" value={stats.childrenCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={8} xl={5}>
          <Card size="small">
            <Statistic title="Below 10" value={stats.childrenBelow10} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={8} xl={5}>
          <Card size="small">
            <Statistic title="Teenage (10–19)" value={stats.childrenTeenage} />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={8} xl={6}>
          <Card size="small">
            <Statistic title="Above 20" value={stats.childrenAbove20} />
          </Card>
        </Col>
      </Row>

      <DataTable
        title="Family Management"
        subtitle="Track family units, relationships, and household members."
        columns={columns}
        dataSource={families}
        loading={loading}
        searchPlaceholder="Search families..."
        searchValue={searchText}
        childrenColumnName="family_tree_children"
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
        actionButton={
          canCreate
            ? {
                label: 'Create Family',
                icon: <PlusOutlined />,
                onClick: () => router.push('/families/add'),
              }
            : undefined
        }
        tableCardClassName="data-table-card"
      />
    </div>
  );
};

const ManageFamilies = () => (
  <PermissionGate permission="families.read">
    <ManageFamiliesContent />
  </PermissionGate>
);

export default ManageFamilies;
