'use client';
import React, { useEffect } from 'react';
import { Form, Input, Button, Switch, Avatar, Upload, Modal, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import StepperWizard from '@/Components/common/StepperWizard';
import { getAvatarUrl } from '@/lib/media-url';
import type { User } from '@/types';

const { Option } = Select;

const USER_WIZARD_STEPS = [
    { title: 'Personal' },
    { title: 'Account' },
    { title: 'Role' },
];

const USER_WIZARD_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#e6f7ff', border: '1px solid #91d5ff' },
];

interface UserWizardModalProps {
    open: boolean;
    editingUser: User | null;
    userForm: FormInstance;
    currentStep: number;
    wizardAvatarPreview: string | null;
    onCancel: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSubmit: () => void;
    onWizardAvatarChange: (info: UploadChangeParam) => void;
}

const UserWizardModal = ({
    open,
    editingUser,
    userForm,
    currentStep,
    wizardAvatarPreview,
    onCancel,
    onNext,
    onPrev,
    onSubmit,
    onWizardAvatarChange,
}: UserWizardModalProps) => {
    // Keep Form mounted via forceRender so the instance stays connected.
    useEffect(() => {
        if (!open) return;

        if (editingUser) {
            userForm.setFieldsValue({
                first_name: editingUser.first_name,
                middle_name: editingUser.middle_name,
                last_name: editingUser.last_name,
                email: editingUser.email,
                role: editingUser.role,
                title: editingUser.title,
                is_active: editingUser.is_active !== undefined ? editingUser.is_active : true,
            });
            return;
        }

        userForm.resetFields();
        userForm.setFieldsValue({ is_active: true });
    }, [open, editingUser, userForm]);

    return (
        <Modal
            title={editingUser ? 'Edit User Registration' : 'New User Registration'}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={700}
            centered
            forceRender
        >
            <div style={{ padding: '16px 0' }}>
                <Form form={userForm} layout="vertical" onFinish={onSubmit}>
                    <StepperWizard
                        steps={USER_WIZARD_STEPS}
                        currentStep={currentStep}
                        onNext={onNext}
                        onPrev={onPrev}
                        submitText={editingUser ? 'Confirm Update' : 'Confirm Registration'}
                        submitLoading={false}
                        stepBackgrounds={USER_WIZARD_BACKGROUNDS}
                        showCancel={false}
                    >
                        <div>
                            <h3 style={{ marginBottom: '20px' }}>Personal Profile</h3>
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Avatar
                                        size={100}
                                        src={wizardAvatarPreview || getAvatarUrl(editingUser?.avatar_url)}
                                        icon={<UserOutlined />}
                                        style={{ backgroundColor: '#f0f2f5', border: '2px solid #d9d9d9' }}
                                    />
                                    <div style={{ marginTop: '8px' }}>
                                        <Upload showUploadList={false} beforeUpload={() => false} onChange={onWizardAvatarChange}>
                                            <Button size="small" icon={<UploadOutlined />}>Upload</Button>
                                        </Upload>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <Form.Item label="First Name" name="first_name" rules={[{ required: true, message: 'First name is required' }]}>
                                            <Input size="large" placeholder="John" />
                                        </Form.Item>
                                        <Form.Item label="Middle Name" name="middle_name">
                                            <Input size="large" placeholder="Optional" />
                                        </Form.Item>
                                    </div>
                                    <Form.Item label="Last Name" name="last_name" rules={[{ required: true, message: 'Last name is required' }]}>
                                        <Input size="large" placeholder="Doe" type="text" />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '20px' }}>Account Setup</h3>
                            <Form.Item
                                label="Email Address"
                                name="email"
                                rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
                                extra={<span style={{ color: '#fa8c16', fontSize: '12px' }}>⚠️ Warning: Email cannot be changed later. Please enter carefully.</span>}
                            >
                                <Input size="large" placeholder="user@example.com" disabled={!!editingUser} />
                            </Form.Item>

                            {!editingUser && (
                                <Form.Item label="Temporary Password" name="password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                                    <Input.Password size="large" placeholder="Set initial password" />
                                </Form.Item>
                            )}
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '20px' }}>Role & Designation</h3>
                            <Form.Item label="Select Role" name="role" rules={[{ required: true, message: 'Please assign a role' }]}>
                                <Select size="large" placeholder="Select an access level">
                                    <Option value="admin">Admin</Option>
                                    <Option value="minister">Minister</Option>
                                    <Option value="staff">Staff</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}>
                                {({ getFieldValue }) => {
                                    const role = getFieldValue('role');
                                    return (role === 'minister' || role === 'staff') ? (
                                        <Form.Item
                                            label="Title / Designation"
                                            name="title"
                                            rules={[{ required: true, message: 'Title is mandatory for this role' }]}
                                        >
                                            <Input size="large" placeholder="e.g. Senior Pastor, IT Manager" />
                                        </Form.Item>
                                    ) : null;
                                }}
                            </Form.Item>

                            <Form.Item label="Account Status" name="is_active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </div>
                    </StepperWizard>
                </Form>
            </div>
        </Modal>
    );
};

export default UserWizardModal;
