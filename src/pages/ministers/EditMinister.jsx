import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, message, Avatar, Tag, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    LockOutlined,
    CheckCircleOutlined,
    EditOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import { getMinisterById, updateMinister, API_BASE_URL } from '../../services/api';
import '../Members/AddMember.css'; // Using the same styling foundation

const STEPS = [
    { title: 'Update Details' },
    { title: 'Confirmation' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
];

const EditMinister = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();

    // State
    const [loading, setLoading] = useState(false);
    const [fetchingMinister, setFetchingMinister] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [minister, setMinister] = useState(null);
    const [updatedData, setUpdatedData] = useState(null);

    useEffect(() => {
        fetchMinisterDetails();
    }, [id]);

    const fetchMinisterDetails = async () => {
        try {
            setFetchingMinister(true);
            const data = await getMinisterById(id);
            setMinister(data);

            // Prefill form
            form.setFieldsValue({
                title: data.user.title || ''
            });
        } catch (error) {
            message.error(error.message || 'Failed to fetch minister details');
            navigate('/ministers/manage');
        } finally {
            setFetchingMinister(false);
        }
    };

    const next = async () => {
        try {
            if (currentStep === 0) {
                await form.validateFields(['title']);
                // Pass validation, submit the update
                await submitUpdate();
                return;
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            // Validation error, do nothing
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const submitUpdate = async () => {
        try {
            setLoading(true);
            const values = form.getFieldsValue();

            const payload = {
                title: values.title,
            };

            if (values.password) {
                payload.password = values.password;
            }

            const response = await updateMinister(id, payload);
            setUpdatedData(response);
            message.success('Minister updated successfully!');
            setCurrentStep(1); // Move to confirmation
        } catch (error) {
            message.error(error.message || 'Failed to update minister');
        } finally {
            setLoading(false);
        }
    };

    const handleWizardSubmit = () => {
        navigate('/ministers/manage');
    };

    const renderFirstLetterAvatar = (firstName) => {
        return (firstName || '?').charAt(0).toUpperCase();
    };

    return (
        <DashboardLayout>
            <div className="add-member-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Ministers
                </Button>

                <div className="add-member-header">
                    <h1>Edit Minister Account</h1>
                    <p>Update minister title and optionally reset their password.</p>
                </div>

                <div className="content-card-unified">
                    <Form autoComplete="off" form={form} layout="vertical">
                        {fetchingMinister ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <Spin size="large" />
                                <h3 style={{ marginTop: '24px', color: '#1565c0' }}>Loading Minister Details...</h3>
                            </div>
                        ) : (
                            <StepperWizard
                                steps={STEPS}
                                currentStep={currentStep}
                                onNext={next}
                                onPrev={prev}
                                onCancel={() => navigate(-1)}
                                submitText="Finish"
                                submitLoading={loading}
                                stepBackgrounds={STEP_BACKGROUNDS}
                                hideNextOnLastStep={true}
                            >
                                {/* =============== STEP 1: Update Details =============== */}
                                <div>
                                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <LockOutlined style={{ color: '#1565c0' }} /> Account Details
                                    </h3>

                                    {minister && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '8px',
                                            marginBottom: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px'
                                        }}>
                                            <Avatar
                                                size={48}
                                                src={minister.user.avatar_url ? `${API_BASE_URL}/${minister.user.avatar_url.replace(/^\//, '')}` : null}
                                                style={{ backgroundColor: '#1565c0' }}
                                            >
                                                {renderFirstLetterAvatar(minister.user.first_name)}
                                            </Avatar>
                                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                                        {minister.user.first_name} {minister.user.middle_name} {minister.user.last_name}
                                                    </div>
                                                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                        {minister.user.email}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => navigate(`/members/edit/${minister.member_id}`)}
                                                >
                                                    Edit Personal Info
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Spin size="large" />
                                            <h3 style={{ marginTop: '24px', color: '#1565c0' }}>Updating Account...</h3>
                                            <p style={{ color: '#64748b' }}>Saving changes to the system.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Form.Item
                                                name="title"
                                                label="Minister Title"
                                                rules={[{ required: true, message: 'Please enter a title' }]}
                                            >
                                                <Input size="large" placeholder="e.g. Senior Pastor, Deacon, Worship Leader" />
                                            </Form.Item>

                                            <Form.Item
                                                name="password"
                                                label="New Password (Optional)"
                                                rules={[
                                                    { min: 6, message: 'Password must be at least 6 characters' }
                                                ]}
                                                extra="Leave blank if you do not wish to change the password."
                                            >
                                                <Input.Password size="large" placeholder="Enter new password" />
                                            </Form.Item>
                                        </>
                                    )}
                                </div>

                                {/* =============== STEP 2: Confirmation =============== */}
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} />
                                    <h2 style={{ color: '#0f172a', marginBottom: '16px' }}>Minister Updated!</h2>

                                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px' }}>
                                        The user account and minister profile have been successfully updated.
                                    </p>

                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '24px',
                                        borderRadius: '8px',
                                        display: 'inline-block',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>Name:</span>
                                            <strong>{minister?.user?.first_name} {minister?.user?.last_name}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>Title:</span>
                                            <Tag color="blue">{updatedData?.user?.title || form.getFieldValue('title')}</Tag>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '40px' }}>
                                        <Button type="primary" size="large" onClick={handleWizardSubmit} style={{ backgroundColor: '#1565c0' }}>
                                            Go to Ministers List
                                        </Button>
                                    </div>
                                </div>

                            </StepperWizard>
                        )}
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditMinister;
