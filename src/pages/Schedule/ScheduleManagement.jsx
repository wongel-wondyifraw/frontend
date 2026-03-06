import React, { useState } from 'react';
import { Calendar, Badge, Modal, Form, Input, DatePicker, TimePicker, Button, Select, Card } from 'antd';
import { PlusOutlined, ClockCircleOutlined, EnvironmentOutlined, CloudUploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DashboardLayout from '../../Layouts/DashboardLayout';
import './ScheduleManagement.css';

const ScheduleManagement = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState('one-time');
    const [form] = Form.useForm();
    const [events, setEvents] = useState([
        { type: 'warning', content: 'Ministry Meeting', date: dayjs().format('YYYY-MM-DD') },
        { type: 'success', content: 'Sunday Service', date: dayjs().add(2, 'day').format('YYYY-MM-DD') },
        { type: 'error', content: 'Youth Camp', date: dayjs().add(5, 'day').format('YYYY-MM-DD') },
    ]);

    const getListData = (value) => {
        const dateString = value.format('YYYY-MM-DD');
        return events.filter(event => event.date === dateString);
    };

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map((item, index) => (
                    <li key={index}>
                        <Badge status={item.type} text={item.content} />
                    </li>
                ))}
            </ul>
        );
    };

    const onFinish = (values) => {
        const newEvent = {
            type: 'primary', // Default type
            content: values.title,
            date: values.date.format('YYYY-MM-DD'),
        };
        setEvents([...events, newEvent]);
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <DashboardLayout>
            <div className="schedule-container">
                <div className="calendar-card">
                    <div className="calendar-header-section">
                        <h3>Calendar</h3>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="middle"
                            style={{
                                borderRadius: '8px',
                                background: '#1E40AF', // Primary Blue
                                border: 'none',
                                color: '#FFFFFF',
                                fontWeight: '500',
                                boxShadow: '0 2px 4px rgba(30, 64, 175, 0.2)'
                            }}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Add Event
                        </Button>
                    </div>
                    <div className="calendar-wrapper">
                        <Calendar dateCellRender={dateCellRender} />
                    </div>
                </div>

                <Modal
                    title="Add New Event"
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form autoComplete="off" form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="title"
                            label="Event Title"
                            rules={[{ required: true, message: 'Please enter event title' }]}
                        >
                            <Input placeholder="e.g., Sunday Service" />
                        </Form.Item>

                        <Form.Item
                            name="date"
                            label="Date"
                            rules={[{ required: true, message: 'Please select date' }]}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Form.Item
                                name="startTime"
                                label="Start Time"
                                style={{ flex: 1 }}
                            >
                                <TimePicker style={{ width: '100%' }} format="HH:mm" />
                            </Form.Item>
                            <Form.Item
                                name="endTime"
                                label="End Time"
                                style={{ flex: 1 }}
                            >
                                <TimePicker style={{ width: '100%' }} format="HH:mm" />
                            </Form.Item>
                        </div>

                        <Form.Item name="recurrence" label="Recurrence Type" initialValue="one-time">
                            <Select onChange={(value) => setRecurrenceType(value)}>
                                <Select.Option value="one-time">One-time</Select.Option>
                                <Select.Option value="recurring">Recurring</Select.Option>
                            </Select>
                        </Form.Item>

                        {recurrenceType === 'recurring' && (
                            <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
                                <Select placeholder="Select frequency">
                                    <Select.Option value="daily">Daily</Select.Option>
                                    <Select.Option value="weekly">Weekly</Select.Option>
                                    <Select.Option value="monthly">Monthly</Select.Option>
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item name="type" label="Event Type">
                            <Select defaultValue="default">
                                <Select.Option value="default">General</Select.Option>
                                <Select.Option value="warning">Ministry</Select.Option>
                                <Select.Option value="success">Service</Select.Option>
                                <Select.Option value="error">Urgent</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="poster" label="Event Poster (Optional)">
                            <div className="poster-upload-container">
                                <label className="poster-upload-label">
                                    <CloudUploadOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
                                    <span>Upload Poster Image</span>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} />
                                </label>
                            </div>
                        </Form.Item>

                        <Form.Item name="location" label="Location">
                            <Input prefix={<EnvironmentOutlined />} placeholder="e.g., Main Hall" />
                        </Form.Item>

                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Button style={{ marginRight: 8 }} onClick={() => setIsModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#1E40AF' }}>
                                Create Event
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default ScheduleManagement;
