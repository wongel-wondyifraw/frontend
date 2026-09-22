import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getLocations, createLocation, updateLocation } from '../../../services/api';
import type { Location } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const { Option } = Select;

const LocationManagementTab: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [searchText, setSearchText] = useState('');

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
        if (loc) {
            form.setFieldsValue({
                name: loc.name,
                status: loc.status,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'active' });
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingLocation(null);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            
            // Check for duplicate name
            const normalizedName = values.name.trim().toLowerCase();
            const isDuplicate = locations.some(loc => 
                loc.name.toLowerCase() === normalizedName && loc.id !== editingLocation?.id
            );
            
            if (isDuplicate) {
                message.error('A location with this name already exists.');
                setSubmitting(false);
                return;
            }

            if (editingLocation) {
                await updateLocation(editingLocation.id, values);
                message.success('Location updated successfully');
            } else {
                await createLocation(values);
                message.success('Location created successfully');
            }
            setIsModalVisible(false);
            fetchLocations();
        } catch (error: any) {
            if (error.errorFields) {
                // validation error
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
            message.success(`Location ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            fetchLocations();
        } catch (error) {
            message.error(getApiErrorMessage(error, 'Failed to update status'));
        }
    };

    const filteredLocations = locations.filter(loc => 
        loc.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Location Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: Location, b: Location) => a.name.localeCompare(b.name),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Inactive', value: 'inactive' },
            ],
            onFilter: (value: boolean | React.Key, record: Location) => record.status === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Location) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => openModal(record)} 
                    />
                    <Button 
                        type="text" 
                        danger={record.status === 'active'}
                        style={{ color: record.status !== 'active' ? '#52c41a' : undefined }}
                        onClick={() => handleToggleStatus(record)}
                    >
                        {record.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Input.Search
                    placeholder="Search locations..."
                    allowClear
                    onSearch={setSearchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    Add Location
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={filteredLocations} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingLocation ? 'Edit Location' : 'Add Location'}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={handleCancel}
                confirmLoading={submitting}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Location Name"
                        rules={[
                            { required: true, message: 'Please enter location name' },
                            { whitespace: true, message: 'Location name cannot be just spaces' }
                        ]}
                    >
                        <Input placeholder="e.g., Downtown, North Side, Region 1" />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default LocationManagementTab;
