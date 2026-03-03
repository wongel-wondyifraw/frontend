import React, { useState } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { Button, Input, Modal, Select, Tag, Avatar, Tooltip, Form, InputNumber } from 'antd';
import { PlusOutlined, BookOutlined, UserOutlined, TeamOutlined, ScheduleOutlined } from '@ant-design/icons';
import './BibleStudy.css';

const { Option } = Select;

const BibleStudy = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teams, setTeams] = useState([
        { id: 1, name: 'Youth Bible Study', members: 12, time: 'Wed 6:00 PM', study: 'Romans 8:1-39', leader: 'Pastor John' },
        { id: 2, name: 'Men\'s Fellowship', members: 8, time: 'Sat 7:00 AM', study: 'Proverbs 3', leader: 'Deacon Mike' },
        { id: 3, name: 'Women of Faith', members: 15, time: 'Tue 10:00 AM', study: 'Ruth 1-4', leader: 'Sarah J.' },
    ]);

    const [form] = Form.useForm();

    const handleCreate = (values) => {
        const newTeam = {
            id: Date.now(),
            name: values.teamName || 'New Group',
            members: 0,
            time: 'TBD',
            study: `${values.book} ${values.chapter}:${values.verses || '1'}`,
            leader: 'Assigned Leader'
        };
        setTeams([...teams, newTeam]);
        setIsModalOpen(false);
        form.resetFields();
    };

    return (
        <SidebarLayout>
            <div className="bible-study-container">
                <div className="bible-header">
                    <div>
                        <h1>Bible Study Management</h1>
                        <p style={{ color: '#64748b' }}>Manage study teams and assign scripture readings.</p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                        Create Study Section
                    </Button>
                </div>

                <div className="study-grid">
                    {teams.map(team => (
                        <div key={team.id} className="team-card">
                            <div className="team-header">
                                <div className="team-name">{team.name}</div>
                                <Tooltip title="Group Leader">
                                    <Tag color="blue">{team.leader}</Tag>
                                </Tooltip>
                            </div>

                            <div className="team-meta">
                                <TeamOutlined /> {team.members} Members
                            </div>
                            <div className="team-meta">
                                <ScheduleOutlined /> {team.time}
                            </div>

                            <div className="study-section-box">
                                <div className="section-label">Current Study</div>
                                <div className="section-value">
                                    <BookOutlined style={{ marginRight: 8 }} />
                                    {team.study}
                                </div>
                            </div>

                            <Button block style={{ marginTop: 16 }}>View Details</Button>
                        </div>
                    ))}

                    <button className="team-card create-section-card" onClick={() => setIsModalOpen(true)}>
                        <PlusOutlined style={{ fontSize: 24, color: '#cbd5e1' }} />
                        <span className="create-text">Add New Study Group</span>
                    </button>
                </div>
            </div>

            <Modal
                title="Create Study Section"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form layout="vertical" onFinish={handleCreate} form={form}>
                    <Form.Item label="Group Name" name="teamName">
                        <Input placeholder="e.g. Young Adults" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 12 }}>
                        <Form.Item label="Book" name="book" rules={[{ required: true }]}>
                            <Select placeholder="Select Book" showSearch>
                                {['Genesis', 'Exodus', 'Psalms', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans'].map(b => (
                                    <Option key={b} value={b}>{b}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Chapter" name="chapter" rules={[{ required: true }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Verses" name="verses">
                            <Input placeholder="1-10" />
                        </Form.Item>
                    </div>

                    <Button type="primary" htmlType="submit" block size="large">
                        Create Section
                    </Button>
                </Form>
            </Modal>
        </SidebarLayout>
    );
};

export default BibleStudy;
