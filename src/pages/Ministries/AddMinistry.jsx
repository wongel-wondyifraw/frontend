import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, TimePicker, Button, message, Row, Col } from 'antd';
import {
    ArrowLeftOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import SidebarLayout from '../../Layouts/SidebarLayout';
import './AddMinistry.css';

const { Option } = Select;
const { TextArea } = Input;

const AddMinistry = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = (values) => {
        setLoading(true);
        console.log('Received values of form: ', values);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            message.success('Ministry created successfully');
            navigate('/ministries/manage');
        }, 1000);
    };

    return (
        <SidebarLayout>
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
                    <h1>Create New Ministry</h1>
                    <p>Set up a new ministry group or team.</p>
                </div>

                <div className="content-card-unified">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ status: 'active' }}
                    >
                        {/* Section 1: Ministry Details */}
                        <div className="form-section">
                            <h3 className="form-section-title-purple">
                                <div className="form-icon-wrapper-purple"><TeamOutlined /></div>
                                Ministry Details
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
                                name="description"
                                label="Description"
                                rules={[{ required: true, message: 'Please enter a description' }]}
                            >
                                <TextArea rows={4} placeholder="Describe the purpose and activities of this ministry..." />
                            </Form.Item>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="leader"
                                        label="Assign Leader"
                                        rules={[{ required: true, message: 'Please Select a leader' }]}
                                    >
                                        <Select placeholder="Select a member" size="large" showSearch>
                                            <Option value="john">John Doe</Option>
                                            <Option value="jane">Jane Smith</Option>
                                            <Option value="david">David Miller</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="status" label="Status">
                                        <Select size="large">
                                            <Option value="active">Active</Option>
                                            <Option value="inactive">Inactive</Option>
                                            <Option value="seasonal">Seasonal</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Section 2: Schedule */}
                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <h3 className="form-section-title-purple">
                                <div className="form-icon-wrapper-purple"><ClockCircleOutlined /></div>
                                Meeting Schedule
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="meetingDay" label="Meeting Day">
                                        <Select placeholder="Select day" size="large">
                                            <Option value="monday">Monday</Option>
                                            <Option value="tuesday">Tuesday</Option>
                                            <Option value="wednesday">Wednesday</Option>
                                            <Option value="thursday">Thursday</Option>
                                            <Option value="friday">Friday</Option>
                                            <Option value="saturday">Saturday</Option>
                                            <Option value="sunday">Sunday</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="meetingTime" label="Meeting Time">
                                        <TimePicker use12Hours format="h:mm a" style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="location" label="Location / Room">
                                <Input placeholder="e.g. Main Sanctuary" size="large" />
                            </Form.Item>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#9333ea', borderColor: '#9333ea', width: '150px' }}>
                                Create Ministry
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default AddMinistry;
