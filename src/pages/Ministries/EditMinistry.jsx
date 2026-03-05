import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, message, Row, Col, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { updateMinistry, getMinistry, getMembers } from '../../services/api';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const EditMinistry = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ministryData, membersData] = await Promise.all([
                    getMinistry(id),
                    getMembers(),
                ]);

                setMembers(membersData);

                form.setFieldsValue({
                    name: ministryData.name,
                    about: ministryData.about,
                    schedule: ministryData.schedule,
                    leader_id: ministryData.leader_id || undefined,
                });
            } catch (error) {
                message.error(error.message || 'Failed to load ministry details');
                navigate('/ministries/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, form, navigate]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const ministryData = {
                name: values.name,
                about: values.about || '',
                schedule: values.schedule || '',
                leader_id: values.leader_id || null,
            };

            await updateMinistry(id, ministryData);
            message.success('Ministry updated successfully');
            navigate('/ministries/manage');
        } catch (error) {
            console.error('Update Ministry Error:', error);
            message.error(error.message || 'Failed to update ministry');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="add-ministry-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministries
                </Button>

                <div className="add-ministry-header">
                    <h1>Edit Ministry Details</h1>
                    <p>Update ministry information and leadership.</p>
                </div>

                <div className="content-card-unified">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                    >
                        {/* Section 1: Ministry Information */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <div className="form-icon-wrapper"><TeamOutlined /></div>
                                Ministry Information
                            </h3>

                            <Row gutter={24}>
                                <Col span={24}>
                                    <Form.Item
                                        name="name"
                                        label="Ministry Name"
                                        rules={[{ required: true, message: 'Please enter ministry name' }]}
                                    >
                                        <Input placeholder="e.g. Worship Team" size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="about"
                                label="About"
                            >
                                <TextArea rows={4} placeholder="Describe the purpose and activities of this ministry..." />
                            </Form.Item>
                        </div>

                        {/* Section 2: Leadership & Schedule */}
                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <h3 className="form-section-title">
                                <div className="form-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}><UserOutlined /></div>
                                Leadership & Schedule
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="leader_id"
                                        label="Assign Leader"
                                    >
                                        <Select
                                            placeholder="Select a member"
                                            size="large"
                                            showSearch
                                            allowClear
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {members.map(member => (
                                                <Option key={member.id} value={member.id}>
                                                    {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="schedule" label="Schedule Details">
                                        <Input placeholder="e.g. Every Thursday 7:00 PM" size="large" prefix={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#1565c0', width: '150px' }}>
                                Update Ministry
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditMinistry;
