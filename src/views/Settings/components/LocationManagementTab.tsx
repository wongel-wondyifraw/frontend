'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Form, Input, Select, Tag } from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DataTable from '@/Components/common/DataTable';
import DataTableFilterPopup from '@/Components/common/DataTableFilterPopup';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import { getLocations, createLocation, updateLocation } from '../../../services/api';
import type { Location } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useCan } from '@/Components/auth/Can';

type LocationFormValues = {
  name: string;
  status: 'active' | 'inactive';
};

const LocationManagementTab: React.FC = () => {
  const canManage = useCan('locations.manage');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form] = Form.useForm<LocationFormValues>();
  const [formSeed, setFormSeed] = useState<Partial<LocationFormValues> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to fetch locations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const openModal = (loc: Location | null = null) => {
    setEditingLocation(loc);
    setFormSeed(
      loc
        ? { name: loc.name, status: loc.status as 'active' | 'inactive' }
        : { name: undefined, status: 'active' },
    );
    setModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open && formSeed) {
      form.setFieldsValue(formSeed);
    }
    if (!open) {
      form.resetFields();
      setFormSeed(null);
      setEditingLocation(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const normalizedName = values.name.trim().toLowerCase();
      const isDuplicate = locations.some(
        (loc) =>
          loc.name.toLowerCase() === normalizedName && loc.id !== editingLocation?.id,
      );

      if (isDuplicate) {
        message.error('A location with this name already exists.');
        return;
      }

      if (editingLocation) {
        await updateLocation(editingLocation.id, values);
        message.success('Location updated successfully');
      } else {
        await createLocation(values);
        message.success('Location created successfully');
      }
      setModalOpen(false);
      fetchLocations();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(getApiErrorMessage(error, 'Failed to save location'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (loc: Location) => {
    try {
      const newStatus = loc.status === 'active' ? 'inactive' : 'active';
      await updateLocation(loc.id, { status: newStatus });
      message.success(
        `Location ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      );
      fetchLocations();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to update status'));
    }
  };

  const filteredLocations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesSearch = !q || loc.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [locations, searchText, statusFilter]);

  const columns: ColumnsType<Location> = [
    {
      title: 'Location',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      responsive: ['sm'],
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
            key: 'actions',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: Location) =>
        canManage ? (
          <TableRowActions
            ariaLabel={`Actions for ${record.name}`}
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => openModal(record),
              },
              {
                key: 'toggle-status',
                label: record.status === 'active' ? 'Deactivate' : 'Activate',
                icon:
                  record.status === 'active' ? (
                    <StopOutlined style={{ color: '#faad14' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ),
                onClick: () => handleToggleStatus(record),
              },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <div className="manage-page settings-section--wide">
      <DataTable
        title="Locations"
        subtitle="Define church campuses and meeting places used across the app."
        columns={columns}
        dataSource={filteredLocations}
        loading={loading}
        rowKey="id"
        searchPlaceholder="Search locations..."
        searchValue={searchText}
        onSearchChange={setSearchText}
        pageSize={10}
        actionButton={
          canManage
            ? {
                label: 'Add Location',
                icon: <PlusOutlined />,
                onClick: () => openModal(),
              }
            : undefined
        }
        filterPanel={
          <DataTableFilterPopup
            activeCount={statusFilter !== 'all' ? 1 : 0}
            onClear={() => setStatusFilter('all')}
          >
            <div className="dt-filter-field">
              <span className="dt-filter-label">Status</span>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </DataTableFilterPopup>
        }
        tableCardClassName="data-table-card"
      />

      <Modal
        title={editingLocation ? 'Edit location' : 'Add location'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnHidden
        afterOpenChange={handleModalOpenChange}
        okText={editingLocation ? 'Save' : 'Create'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} preserve={false}>
          <Form.Item
            name="name"
            label="Location name"
            rules={[
              { required: true, message: 'Enter a location name' },
              { whitespace: true, message: 'Location name cannot be blank' },
            ]}
          >
            <Input placeholder="e.g. Main Sanctuary" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationManagementTab;
