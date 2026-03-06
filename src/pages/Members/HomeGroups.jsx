import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Input, Select, Tag, Avatar, Tooltip } from 'antd';
import { PlusOutlined, UserOutlined, ClockCircleOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import './HomeGroups.css';

const HomeGroups = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Mock Data
    const [groups, setGroups] = useState([
        {
            id: 1,
            name: "North Hills Fellowship",
            leader: "John Doe",
            day: "Wednesday",
            time: "19:00",
            location: "North Hills Community Center",
            members: [1, 2, 3, 4, 5]
        },
        {
            id: 2,
            name: "Downtown Bible Study",
            leader: "Sarah Smith",
            day: "Thursday",
            time: "18:30",
            location: "123 Main St, Apt 4B",
            members: [1, 2, 3]
        },
    ]);

    const onFinish = (values) => {
        const newGroup = {
            id: groups.length + 1,
            name: values.name,
            leader: values.leader,
            day: values.day,
            time: values.time,
            location: values.location,
            members: [] // Initial empty members
        };
        setGroups([...groups, newGroup]);
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <DashboardLayout>
            <div className="home-groups-container">
                <div className="home-groups-header">
                    <h2>Home Groups</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Input placeholder="Search groups..." prefix={<SearchOutlined />} style={{ width: 250 }} />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                            style={{ background: '#1565c0' }}
                        >
                            Create Group
                        </Button>
                    </div>
                </div>

                <div className="home-groups-grid">
                    {groups.map(group => (
                        <div key={group.id} className="group-card">
                            <div className="group-header">
                                <h3 className="group-title">{group.name}</h3>
                                <Tag color="blue">{group.members.length} Members</Tag>
                            </div>

                            <div className="group-leader">
                                <UserOutlined /> Leader: {group.leader}
                            </div>

                            <div className="group-info">
                                <div className="group-info-item">
                                    <ClockCircleOutlined /> {group.day} at {group.time}
                                </div>
                                <div className="group-info-item">
                                    <EnvironmentOutlined /> {group.location}
                                </div>
                            </div>

                            <div className="group-members-preview">
                                {group.members.slice(0, 4).map((_, i) => (
                                    <Tooltip title={`Member ${i + 1}`} key={i}>
                                        <Avatar size="small" icon={<UserOutlined />} className="member-avatar" />
                                    </Tooltip>
                                ))}
                                {group.members.length > 4 && (
                                    <div className="member-avatar">+{group.members.length - 4}</div>
                                )}
                            </div>

                            <div className="group-actions">
                                <Button type="link" size="small" onClick={() => navigate(`/members/home-groups/${group.id}`)}>View Details</Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Modal
                    title="Create Home Group"
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form autoComplete="off" form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g., North Hills Fellowship" />
                        </Form.Item>
                        <Form.Item name="leader" label="Leader" rules={[{ required: true }]}>
                            <Input placeholder="Search for a member..." prefix={<UserOutlined />} />
                        </Form.Item>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Form.Item name="day" label="Day" style={{ flex: 1 }} rules={[{ required: true }]}>
                                <Select placeholder="Select day">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <Select.Option key={day} value={day}>{day}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="time" label="Time" style={{ flex: 1 }} rules={[{ required: true }]}>
                                <Input type="time" />
                            </Form.Item>
                        </div>
                        <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                            <Input prefix={<EnvironmentOutlined />} placeholder="Address or meeting place" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block style={{ background: '#1565c0' }}>
                                Create Group
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default HomeGroups;
