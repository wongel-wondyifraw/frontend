import React, { useState } from 'react';
import { Tag, Button, Avatar, message, Modal, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../Layouts/DashboardLayout';
import DataTable from '../../Components/common/DataTable';
import './ManageMinisters.css';

// Hardcoded ministers data for prototype
const MINISTERS_DATA = [
    {
        id: '1',
        first_name: 'Pastor',
        middle_name: 'David',
        last_name: 'Bekele',
        title: 'Senior Pastor',
        email: 'david.bekele@church.com',
        phone: '+251 911 000 001',
        ordination_date: '2018-06-15',
        status: 'active',
        department: 'Pastoral',
        created_at: '2020-01-10',
    },
    {
        id: '2',
        first_name: 'Evangelist',
        middle_name: '',
        last_name: 'Almaz Tesfaye',
        title: 'Youth Evangelist',
        email: 'almaz.t@church.com',
        phone: '+251 922 000 002',
        ordination_date: '2021-03-20',
        status: 'active',
        department: 'Youth',
        created_at: '2021-04-01',
    },
    {
        id: '3',
        first_name: 'Deacon',
        middle_name: 'Yohannes',
        last_name: 'Girma',
        title: 'Deacon',
        email: 'yohannes.g@church.com',
        phone: '+251 933 000 003',
        ordination_date: '2019-11-10',
        status: 'active',
        department: 'Administration',
        created_at: '2019-12-01',
    },
    {
        id: '4',
        first_name: 'Pastor',
        middle_name: '',
        last_name: 'Meron Hailu',
        title: 'Associate Pastor',
        email: 'meron.h@church.com',
        phone: '+251 944 000 004',
        ordination_date: '2022-01-05',
        status: 'inactive',
        department: 'Worship',
        created_at: '2022-02-01',
    },
    {
        id: '5',
        first_name: 'Elder',
        middle_name: 'Samuel',
        last_name: 'Habtamu',
        title: 'Church Elder',
        email: 'samuel.h@church.com',
        phone: '+251 955 000 005',
        ordination_date: '2017-08-25',
        status: 'active',
        department: 'Pastoral',
        created_at: '2017-09-01',
    },
];

const ManageMinisters = () => {
    const navigate = useNavigate();
    const [ministers, setMinisters] = useState(MINISTERS_DATA);
    const [loading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Delete handler with confirmation
    const handleDelete = (minister) => {
        Modal.confirm({
            title: 'Delete Minister?',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to delete ${minister.first_name} ${minister.last_name}? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => {
                setMinisters(prev => prev.filter(m => m.id !== minister.id));
                message.success('Minister deleted successfully');
            },
        });
    };

    // Filter ministers by search
    const filteredMinisters = ministers.filter(minister => {
        const q = searchText.toLowerCase();
        const fullName = `${minister.first_name || ''} ${minister.middle_name || ''} ${minister.last_name || ''}`.toLowerCase();
        return (
            fullName.includes(q) ||
            minister.email?.toLowerCase().includes(q) ||
            minister.phone?.toLowerCase().includes(q) ||
            minister.title?.toLowerCase().includes(q) ||
            minister.department?.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_, record) => {
                const initial = (record.first_name || '?').charAt(0).toUpperCase();
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar
                            style={{ backgroundColor: '#1565c0', fontWeight: 600, fontSize: '16px' }}
                        >
                            {initial}
                        </Avatar>
                        <div>
                            <span style={{ fontWeight: 600 }}>
                                {record.first_name} {record.middle_name ? record.middle_name + ' ' : ''}{record.last_name}
                            </span>
                            {record.email && (
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{record.email}</div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: title => title || '-',
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: dept => {
                if (!dept) return '-';
                const colorMap = {
                    pastoral: '#3B82F6',
                    youth: '#10b981',
                    worship: '#f59e0b',
                    administration: '#8b5cf6',
                };
                const color = colorMap[dept.toLowerCase()] || '#94A3B8';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 10px', fontWeight: 500 }}>
                        {dept}
                    </Tag>
                );
            },
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: phone => phone || '-',
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            render: (status) => {
                const s = (status || 'active').toLowerCase();
                const color = s === 'active' ? '#10b981' : '#ef4444';
                return (
                    <Tag color={color} style={{ borderRadius: '20px', padding: '0 12px', fontWeight: 600 }}>
                        {s.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Ordained',
            dataIndex: 'ordination_date',
            key: 'ordination_date',
            render: date => date ? new Date(date).toLocaleDateString() : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="View Details">
                        <Button
                            icon={<InfoCircleOutlined style={{ color: '#1565c0' }} />}
                            onClick={() => navigate(`/ministers/details/${record.id}`)}
                        />
                    </Tooltip>
                    <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            size="small"
                            onClick={() => navigate(`/ministers/edit/${record.id}`)}
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
        <DashboardLayout>
            <div className="manage-ministers-container">
                <DataTable
                    title="Manage Ministers"
                    columns={columns}
                    dataSource={filteredMinisters}
                    loading={loading}
                    rowKey="id"
                    searchPlaceholder="Search ministers..."
                    searchValue={searchText}
                    onSearchChange={setSearchText}
                    pageSize={10}
                    actionButton={{
                        label: 'Add Minister',
                        icon: <PlusOutlined />,
                        onClick: () => navigate('/ministers/add'),
                    }}
                    tableCardClassName="ministers-table-card"
                />
            </div>
        </DashboardLayout>
    );
};

export default ManageMinisters;