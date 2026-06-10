'use client';
import React from 'react';
import { Form, Input, Button, Avatar, Upload, Row, Col, Space } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import { useUser } from '@/context/UserContext';
import { getAvatarUrl } from '@/lib/media-url';
import type { User } from '@/types';

const { TextArea } = Input;

interface ProfileTabProps {
    form: FormInstance;
    loading: boolean;
    profile: User | null;
    avatarPreview: string | null;
    onProfileUpdate: (values: Record<string, string>) => void;
    onAvatarUpload: (file: File, userId: string) => boolean | Promise<boolean>;
}

const ProfileTab = ({
    form,
    loading,
    profile,
    avatarPreview,
    onProfileUpdate,
    onAvatarUpload,
}: ProfileTabProps) => {
    const { avatarVersion } = useUser();

    return (
        <div className="settings-section">
            <Row gutter={[48, 24]}>
                <Col xs={24} lg={16}>
                    <h3>Personal Information</h3>
                    <Form layout="vertical" form={form} onFinish={onProfileUpdate}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Middle Name" name="middleName">
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Email Address" name="email">
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Input disabled />
                                        <Button disabled icon={<LockOutlined />} />
                                    </Space.Compact>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Role" name="role">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item label="Bio" name="bio">
                            <TextArea rows={4} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#1565c0' }}>
                            Save Changes
                        </Button>
                    </Form>
                </Col>
                <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', borderLeft: '1px solid var(--border-color)', minHeight: '300px', paddingTop: '40px' }}>
                    <h3 style={{ marginBottom: '24px' }}>Profile Picture</h3>
                    <Avatar
                        size={160}
                        icon={<UserOutlined />}
                        src={avatarPreview || getAvatarUrl(profile?.avatar_url, avatarVersion)}
                        style={{
                            border: '4px solid var(--border-color)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            marginBottom: '24px',
                            backgroundColor: 'var(--bg-hover)',
                            color: 'var(--primary-blue)',
                            objectFit: 'cover'
                        }}
                    />
                    <Upload
                        showUploadList={false}
                        beforeUpload={(file) => onAvatarUpload(file, profile?.id ?? '')}
                    >
                        <Button icon={<UploadOutlined />} type="primary" ghost>
                            Change Photo
                        </Button>
                    </Upload>
                    <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        Allowed JPG or PNG. Max size of 800K
                    </p>
                </Col>
            </Row>
        </div>
    );
};

export default ProfileTab;
