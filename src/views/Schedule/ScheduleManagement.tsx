'use client';
import React, { useState } from 'react';
import { Calendar, Badge, Modal, Form, Input, DatePicker, TimePicker, Button, Select } from 'antd';
import { PlusOutlined, EnvironmentOutlined, CloudUploadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import './ScheduleManagement.css';

type EventType = 'warning' | 'success' | 'error' | 'default' | 'processing';

interface ScheduleEvent {
    type: EventType;
    content: string;
    date: string;
}

const ScheduleManagement = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState('one-time');
    const [form] = Form.useForm();
    const [events, setEvents] = useState<ScheduleEvent[]>([
        { type: 'warning', content: 'Ministry Meeting', date: dayjs().format('YYYY-MM-DD') },
        { type: 'success', content: 'Sunday Service', date: dayjs().add(2, 'day').format('YYYY-MM-DD') },
        { type: 'error', content: 'Youth Camp', date: dayjs().add(5, 'day').format('YYYY-MM-DD') },
    ]);

    const getListData = (value: Dayjs) => {
        const dateString = value.format('YYYY-MM-DD');
        return events.filter(event => event.date === dateString);
    };

    const dateCellRender = (value: Dayjs) => {
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

    const onFinish = (values: { title: string; date: Dayjs }) => {
        const newEvent: ScheduleEvent = {
            type: 'default',
            content: values.title,
            date: values.date.format('YYYY-MM-DD'),
        };
        setEvents([...events, newEvent]);
        form.resetFields();
        setIsModalVisible(false);
    };

    return (
        <div className="schedule-container">
            <div className="calendar-card">
                <div className="calendar-header-section page-section-header">
                    <div className="page-section-header-text">
                        <h2>Church Schedule</h2>
                        <p>View and manage church events on the calendar.</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        style={{ background: '#1565c0' }}
                    >
                        Add Event
                    </Button>
                </div>
                <div className="calendar-wrapper">
                    <Calendar cellRender={dateCellRender} />
                </div>
            </div>

            <Modal
                title="Add New Event"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                forceRender
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Event Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter an event title' }]}
                    >
                        <Input placeholder="e.g. Sunday Service" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Date"
                        name="date"
                        rules={[{ required: true, message: 'Please select a date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} size="large" />
                    </Form.Item>

                    <Form.Item label="Time">
                        <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" />
                    </Form.Item>

                    <Form.Item label="Recurrence">
                        <Select
                            value={recurrenceType}
                            onChange={setRecurrenceType}
                            size="large"
                            options={[
                                { value: 'one-time', label: 'One-time' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="Location">
                        <Input prefix={<EnvironmentOutlined />} placeholder="Event location" size="large" />
                    </Form.Item>

                    <Form.Item label="Event Poster">
                        <div className="poster-upload-container">
                            <label className="poster-upload-label">
                                <CloudUploadOutlined style={{ fontSize: 24, color: '#1565c0' }} />
                                <span>Click to upload poster (optional)</span>
                                <input type="file" accept="image/*" hidden />
                            </label>
                        </div>
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <Button onClick={() => setIsModalVisible(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" style={{ background: '#1565c0' }}>
                            Save Event
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ScheduleManagement;
