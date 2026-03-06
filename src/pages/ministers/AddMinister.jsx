import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Avatar, List, Tag, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    LockOutlined,
    CheckCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../Layouts/DashboardLayout';
import StepperWizard from '../../Components/common/StepperWizard';
import { getMembers, createMinister, API_BASE_URL } from '../../services/api';
import '../Members/AddMember.css'; // Using the same styling foundation


const STEPS = [
    { title: 'Select Member' },
    { title: 'Account Setup' },
    { title: 'Confirmation' },
];

const STEP_BACKGROUNDS = [
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
    { background: '#f8fafc', border: 'none' },
];

const AddMinister = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // State
    const [loading, setLoading] = useState(false);
    const [fetchingMembers, setFetchingMembers] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [createdMinisterData, setCreatedMinisterData] = useState(null);

    useEffect(() => {
        fetchBaptizedMembers();
    }, []);

    const fetchBaptizedMembers = async () => {
        try {
            setFetchingMembers(true);
            const data = await getMembers(true); // pass baptized=true
            setMembers(data);
            setFilteredMembers(data);
        } catch (error) {
            message.error(error.message || 'Failed to fetch members');
        } finally {
            setFetchingMembers(false);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = members.filter(m =>
            m.first_name.toLowerCase().includes(query) ||
            m.last_name.toLowerCase().includes(query) ||
            (m.email && m.email.toLowerCase().includes(query))
        );
        setFilteredMembers(filtered);
    };

    const selectMember = (member) => {
        setSelectedMember(member);
        form.setFieldsValue({ member_id: member.id });
    };

    const next = async () => {
        try {
            if (currentStep === 0) {
                if (!selectedMember) {
                    message.error('Please select a member first');
                    return;
                }
            } else if (currentStep === 1) {
                await form.validateFields(['title', 'password']);
                // Handle actual submission since clicking "Next" from step 2 goes to step 3 (confirmation)
                await submitMinister();
                return; // submitMinister will bump the step
            }
            setCurrentStep(currentStep + 1);
        } catch (error) {
            // Validation error, do nothing
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const submitMinister = async () => {
        try {
            setLoading(true);
            const values = form.getFieldsValue();

            const payload = {
                member_id: selectedMember.id,
                title: values.title,
                password: values.password
            };

            const response = await createMinister(payload);
            setCreatedMinisterData(response);
            message.success('Minister account created successfully!');
            setCurrentStep(2); // Move to confirmation
        } catch (error) {
            message.error(error.message || 'Failed to create minister account');
        } finally {
            setLoading(false);
        }
    };

    // We don't use typical StepperWizard onFinish because Step 2's Next button triggers it
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
                    <h1>Register New Minister</h1>
                    <p>Select a baptized member and set up their minister account credentials.</p>
                </div>

                <div className="content-card-unified">
                    <Form form={form} layout="vertical">
                        {/* Hidden field to keep track of selected member */}
                        <Form.Item name="member_id" hidden><Input /></Form.Item>

                        <StepperWizard
                            steps={STEPS}
                            currentStep={currentStep}
                            onNext={next}
                            onPrev={prev}
                            onCancel={() => navigate(-1)}
                            submitText="Go to Ministers List"
                            submitLoading={loading}
                            stepBackgrounds={STEP_BACKGROUNDS}
                            hideNextOnLastStep={true} // Usually we change submitText
                        >
                            {/* =============== STEP 1: Select Member =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserOutlined style={{ color: '#1565c0' }} /> Choose Baptized Member
                                </h3>

                                <Input
                                    size="large"
                                    placeholder="Search by name or email..."
                                    prefix={<SearchOutlined />}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    style={{ marginBottom: '24px' }}
                                />

                                {fetchingMembers ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <Spin size="large" />
                                        <div style={{ marginTop: '16px', color: '#64748b' }}>Loading baptized members...</div>
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '12px' }}>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={filteredMembers}
                                            locale={{ emptyText: 'No baptized members found' }}
                                            renderItem={(item) => {
                                                const isSelected = selectedMember?.id === item.id;
                                                const fullName = `${item.first_name} ${item.middle_name || ''} ${item.last_name}`;

                                                return (
                                                    <List.Item
                                                        onClick={() => selectMember(item)}
                                                        className="member-list-item" // Custom hover styling usually applied
                                                        style={{
                                                            cursor: 'pointer',
                                                            padding: '16px',
                                                            marginBottom: '12px',
                                                            borderRadius: '8px',
                                                            border: isSelected ? '2px solid #1565c0' : '1px solid #e2e8f0',
                                                            backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={
                                                                <Avatar
                                                                    size={48}
                                                                    src={item.image_url ? `${API_BASE_URL}/${item.image_url.replace(/^\//, '')}` : null}
                                                                    style={{ backgroundColor: '#1565c0' }}
                                                                >
                                                                    {renderFirstLetterAvatar(item.first_name)}
                                                                </Avatar>
                                                            }
                                                            title={<strong style={{ fontSize: '16px', color: '#0f172a' }}>{fullName}</strong>}
                                                            description={
                                                                <div>
                                                                    <div style={{ color: '#64748b' }}>{item.email || 'No email provided'}</div>
                                                                    <div style={{ color: '#64748b' }}>{item.phone || 'No phone'}</div>
                                                                </div>
                                                            }
                                                        />
                                                    </List.Item>
                                                );
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* =============== STEP 2: Account Setup =============== */}
                            <div>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <LockOutlined style={{ color: '#1565c0' }} /> Account Setup
                                </h3>

                                {selectedMember && (
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <Avatar size={48} src={selectedMember.image_url ? `${API_BASE_URL}/${selectedMember.image_url.replace(/^\//, '')}` : null} style={{ backgroundColor: '#1565c0' }}>
                                            {renderFirstLetterAvatar(selectedMember.first_name)}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                                {selectedMember.first_name} {selectedMember.middle_name} {selectedMember.last_name}
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                Creating Minister Account for this member
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <Spin size="large" />
                                        <h3 style={{ marginTop: '24px', color: '#1565c0' }}>Creating Account...</h3>
                                        <p style={{ color: '#64748b' }}>Setting up system access and linking records.</p>
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
                                            label="Temporary Password"
                                            rules={[
                                                { required: true, message: 'Password is required' },
                                                { min: 6, message: 'Password must be at least 6 characters' }
                                            ]}
                                            extra="This password will be used by the minister to log in."
                                        >
                                            <Input.Password size="large" placeholder="Enter secure password" />
                                        </Form.Item>
                                    </>
                                )}
                            </div>

                            {/* =============== STEP 3: Confirmation =============== */}
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }} />
                                <h2 style={{ color: '#0f172a', marginBottom: '16px' }}>Minister Added Successfully!</h2>

                                <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px' }}>
                                    The user account has been securely created and linked to the member profile.
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
                                        <strong>{selectedMember?.first_name} {selectedMember?.last_name}</strong>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>Email:</span>
                                        <strong>{createdMinisterData?.user?.email || selectedMember?.email}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'inline-block', width: '100px' }}>Title:</span>
                                        <Tag color="blue">{form.getFieldValue('title')}</Tag>
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px' }}>
                                    <Button type="primary" size="large" onClick={handleWizardSubmit} style={{ backgroundColor: '#1565c0' }}>
                                        Go to Ministers List
                                    </Button>
                                </div>
                            </div>

                        </StepperWizard>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddMinister;
