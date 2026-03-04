import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Button, Upload, message, Row, Col } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    UploadOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    GlobalOutlined,
    PrinterOutlined,
    PaperClipOutlined
} from '@ant-design/icons';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { updateMember, getMemberById, API_BASE_URL } from '../../services/api';
import dayjs from 'dayjs';
import GlobalSpinner from '../../Components/Spinner/GlobalSpinner';
import './AddMember.css';

const { Option } = Select;
const { TextArea } = Input;

const EditMember = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const member = await getMemberById(id);
                form.setFieldsValue({
                    firstName: member.first_name,
                    middleName: member.middle_name,
                    lastName: member.last_name,
                    email: member.email,
                    phone: member.phone,
                    address: member.address,
                    dob: member.date_of_birth ? dayjs(member.date_of_birth) : null,
                    maritalStatus: member.marital_status,
                    role: member.role,
                    status: member.status === 'ACTIVE' ? 'active' : 'inactive',
                });

                // If there were an initial image preview set up here, we'd handle it.
            } catch (error) {
                message.error(error.message || 'Failed to fetch member details');
                navigate('/members/manage');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchMember();
    }, [id, form, navigate]);

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('firstName', values.firstName);
            formData.append('lastName', values.lastName);
            formData.append('phone', values.phone);
            if (values.email) formData.append('email', values.email);
            if (values.address) formData.append('address', values.address);
            if (values.dob) formData.append('dob', values.dob.format('YYYY-MM-DD'));
            if (values.maritalStatus) formData.append('maritalStatus', values.maritalStatus);
            if (values.role) formData.append('role', values.role);
            if (values.status) formData.append('status', values.status);

            if (values.profileImage && values.profileImage.length > 0) {
                formData.append('profileImage', values.profileImage[0].originFileObj);
            }

            await updateMember(id, formData);

            message.success('Member updated successfully');
            navigate('/members/manage');
        } catch (error) {
            message.error(error.message || 'Failed to update member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidebarLayout>
            <div className="add-member-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#64748b' }}
                >
                    Back to Members
                </Button>

                <GlobalSpinner loading={loading || initialLoading} />

                <div className="add-member-header">
                    <h1>Edit Member Details</h1>
                    <p>Update personal information and contact details.</p>
                </div>

                <div className="content-card-unified">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ status: 'active' }}
                    >
                        {/* Section 1: Personal Information */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <div className="form-icon-wrapper"><UserOutlined /></div>
                                Personal Information
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="firstName"
                                        label="First Name"
                                        rules={[{ required: true, message: 'Please enter first name' }]}
                                    >
                                        <Input placeholder="John" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="lastName"
                                        label="Last Name"
                                        rules={[{ required: true, message: 'Please enter last name' }]}
                                    >
                                        <Input placeholder="Doe" size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email Address"
                                        rules={[
                                            { required: true, message: 'Please enter email' },
                                            { type: 'email', message: 'Please enter a valid email' }
                                        ]}
                                    >
                                        <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="john@example.com" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="phone"
                                        label="Phone Number"
                                        rules={[{ required: true, message: 'Please enter phone number' }]}
                                    >
                                        <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+1 (555) 000-0000" size="large" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="address"
                                label="Address"
                            >
                                <Input prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} placeholder="123 Church St, City, State" size="large" />
                            </Form.Item>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="dob" label="Date of Birth">
                                        <DatePicker style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="maritalStatus" label="Marital Status">
                                        <Select placeholder="Select status" size="large">
                                            <Option value="single">Single</Option>
                                            <Option value="married">Married</Option>
                                            <Option value="divorced">Divorced</Option>
                                            <Option value="widowed">Widowed</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Section 2: Church Details */}
                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <h3 className="form-section-title">
                                <div className="form-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}><GlobalOutlined /></div>
                                Church Details
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="role" label="Role" initialValue="Member">
                                        <Select size="large">
                                            <Option value="Member">Member</Option>
                                            <Option value="Volunteer">Volunteer</Option>
                                            <Option value="Leader">Leader</Option>
                                            <Option value="Staff">Staff</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="status" label="Membership Status">
                                        <Select size="large">
                                            <Option value="active">Active</Option>
                                            <Option value="inactive">Inactive</Option>
                                            <Option value="visitor">Visitor</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="joinedDate" label="Joined Date">
                                        <DatePicker style={{ width: '100%' }} size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="baptized" label="Baptized?">
                                        <Select size="large">
                                            <Option value="yes">Yes</Option>
                                            <Option value="no">No</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="ministry" label="Assign to Ministry (Optional)">
                                <Select placeholder="Select ministries" mode="multiple" size="large">
                                    <Option value="worship">Worship Team</Option>
                                    <Option value="kids">Kids Church</Option>
                                    <Option value="ushers">Ushers</Option>
                                </Select>
                            </Form.Item>
                        </div>

                        {/* Section 3: Attachments */}
                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <h3 className="form-section-title">
                                <div className="form-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}><PaperClipOutlined /></div>
                                Attachments
                            </h3>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="profileImage" label="Profile Image" valuePropName="fileList" getValueFromEvent={normFile}>
                                        <Upload beforeUpload={() => false} listType="picture" maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Upload Profile Picture</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="churchLetter" label="Church Letter / Transfer Certificate (Optional)">
                                        <Upload maxCount={1}>
                                            <Button icon={<UploadOutlined />}>Upload Document</Button>
                                        </Upload>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <Button size="large" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#1565c0', width: '150px' }}>
                                Update Member
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </SidebarLayout>
    );
};

export default EditMember;
