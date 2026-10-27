'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    App,
    Tag,
    Button,
    Spin,
    Avatar,
    Popconfirm,
    Card,
    Tooltip,
    Modal,
    Empty,
    Statistic,
    Form,
    Input,
    InputNumber,
    Radio,
} from 'antd';
import { message } from '@/lib/app-message';
import {
    EditOutlined,
    DeleteOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    FilePdfOutlined,
    TeamOutlined,
    InfoCircleOutlined,
    IdcardOutlined,
    GlobalOutlined,
    HomeOutlined,
    HeartOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {
    getMemberById,
    deleteMember,
    removeMinistryMember,
    getFamilyByMember,
    createFamily,
    updateFamily,
    addFamilyChild,
    updateFamilyChild,
    deleteFamilyChild,
    updateMember,
} from '../../services/api';
import SpouseSelect, { decodeLeaderValue } from '@/Components/common/SpouseSelect';
import { useCan } from '@/Components/auth/Can';
import type { MemberDetailProps, Member, Family, FamilyChild } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { getImageUrl } from '@/lib/media-url';
import { getInitials } from '@/lib/initials';
import { MEMBER_TYPE_OPTIONS } from '@/lib/member-payload';
import { leaderDisplayName } from '../../Components/common/LeaderLabel';
import './MemberDetail.css';

function yesNoTag(value: unknown) {
  const yes = value === true || value === 'true' || value === 'yes';
  return yes ? (
    <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '2px 8px', borderRadius: 4 }}>
      Yes
    </Tag>
  ) : (
    <Tag color="default" style={{ padding: '2px 8px', borderRadius: 4 }}>
      No
    </Tag>
  );
}

function memberTypeLabel(type?: string | null) {
  const found = MEMBER_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Existing Member');
}

const MemberDetail = ({ memberId: memberIdProp, initialMember = null }: MemberDetailProps) => {
    const params = useParams();
    const id = (memberIdProp || params?.id) as string;
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(initialMember);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(initialMember === null);

    const { modal } = App.useApp();

    const canUpdateFamily = useCan('families.update');
    const canCreateFamily = useCan('families.create');
    const canManageFamily = canUpdateFamily || canCreateFamily;

    const [spouseModalOpen, setSpouseModalOpen] = useState(false);
    const [spouseSubmitting, setSpouseSubmitting] = useState(false);
    const [spouseForm] = Form.useForm();

    const [childModalOpen, setChildModalOpen] = useState(false);
    const [childSubmitting, setChildSubmitting] = useState(false);
    const [editingChild, setEditingChild] = useState<FamilyChild | null>(null);
    const [childForm] = Form.useForm();

    const calculateAge = (dobString: string): number | undefined => {
        if (!dobString) return undefined;
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return undefined;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 0 ? age : 0;
    };

    const fetchMemberDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [data, familyData] = await Promise.all([
                getMemberById(id),
                getFamilyByMember(id).catch(() => null),
            ]);
            setMember(data);
            setFamily(familyData);
        } catch (_error) {
            message.error('Failed to load member details');
            router.push('/members/manage');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (initialMember !== null) {
            getFamilyByMember(id)
                .then(setFamily)
                .catch(() => setFamily(null));
            return;
        }
        fetchMemberDetails();
    }, [initialMember, fetchMemberDetails, id]);

    const handleDelete = async () => {
        try {
            await deleteMember(id);
            message.success('Member deleted successfully');
            router.push('/members/manage');
        } catch (_error) {
            message.error('Failed to delete member');
        }
    };

    const handleRemoveMinistry = (ministryId: string, ministryName: string) => {
        modal.confirm({
            title: 'Remove from Ministry',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to remove this member from "${ministryName}"?`,
            okText: 'Remove',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await removeMinistryMember(ministryId, id);
                    message.success(`Removed from ${ministryName}`);
                    fetchMemberDetails();
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to remove from ministry'));
                }
            },
        });
    };

    const handleLinkSpouse = async () => {
        if (!member) return;
        try {
            const values = await spouseForm.validateFields();
            setSpouseSubmitting(true);

            const isMale = (member.gender || '').toLowerCase() === 'male';
            let spouseData: Record<string, unknown> = {};

            if (values.spouse_type === 'church') {
                const decoded = decodeLeaderValue(values.internal_spouse_id);
                const spouseId = decoded.leader_id || values.internal_spouse_id;
                const spouseType = decoded.leader_type || 'member';

                if (isMale) {
                    spouseData = { wife_id: spouseId, wife_type: spouseType, spouse_status: 'registered' };
                } else {
                    spouseData = { husband_id: spouseId, husband_type: spouseType, spouse_status: 'registered' };
                }
            } else {
                spouseData = {
                    spouse_status: 'external',
                    external_spouse_name: values.external_spouse_name?.trim(),
                    external_spouse_phone: values.external_spouse_phone?.trim() || null,
                    external_spouse_church: values.external_spouse_church?.trim() || null,
                };
            }

            if (family?.id) {
                await updateFamily(family.id, spouseData);
            } else {
                const basePayload: Record<string, unknown> = {
                    name: `The ${member.last_name || 'Family'} Family`,
                    ...spouseData,
                };
                if (isMale) {
                    basePayload.husband_id = member.id;
                    basePayload.husband_type = 'member';
                } else {
                    basePayload.wife_id = member.id;
                    basePayload.wife_type = 'member';
                }
                await createFamily(basePayload);
            }

            if (member.marital_status !== 'married') {
                await updateMember(member.id, { marital_status: 'married' });
            }

            message.success('Spouse linked successfully');
            setSpouseModalOpen(false);
            spouseForm.resetFields();
            await fetchMemberDetails();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error(getApiErrorMessage(error, 'Failed to link spouse'));
        } finally {
            setSpouseSubmitting(false);
        }
    };

    const handleSaveChild = async () => {
        if (!member) return;
        try {
            const values = await childForm.validateFields();
            setChildSubmitting(true);

            const payload: { name: string; date_of_birth?: string; age?: number } = {
                name: values.name.trim(),
                date_of_birth: values.date_of_birth || undefined,
                age: values.age !== undefined && values.age !== null ? Number(values.age) : undefined,
            };

            if (editingChild && family?.id) {
                await updateFamilyChild(family.id, editingChild.id, payload);
                message.success('Child updated successfully');
            } else {
                let activeFamilyId = family?.id;

                if (!activeFamilyId) {
                    const isFemale = (member.gender || '').toLowerCase() === 'female';
                    const isMarried = (member.marital_status || '').toLowerCase() === 'married';
                    const basePayload: Record<string, unknown> = {
                        name: `The ${member.last_name || 'Family'} Family`,
                        spouse_status: isMarried ? 'pending' : 'none',
                    };
                    if (isFemale) {
                        basePayload.wife_id = member.id;
                        basePayload.wife_type = 'member';
                    } else {
                        basePayload.husband_id = member.id;
                        basePayload.husband_type = 'member';
                    }
                    const createdFamily = await createFamily(basePayload);
                    activeFamilyId = createdFamily.id;
                }

                await addFamilyChild(activeFamilyId, payload);
                message.success('Child added successfully');
            }

            setChildModalOpen(false);
            setEditingChild(null);
            childForm.resetFields();
            await fetchMemberDetails();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error(getApiErrorMessage(error, editingChild ? 'Failed to update child' : 'Failed to add child'));
        } finally {
            setChildSubmitting(false);
        }
    };

    const handleDeleteChild = (child: FamilyChild) => {
        if (!family?.id) return;
        modal.confirm({
            title: 'Remove Child',
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            content: `Are you sure you want to remove "${child.name}" from this family?`,
            okText: 'Remove',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteFamilyChild(family.id, child.id);
                    message.success('Child removed');
                    await fetchMemberDetails();
                } catch (error: unknown) {
                    message.error(getApiErrorMessage(error, 'Failed to remove child'));
                }
            },
        });
    };

    const openAddChild = () => {
        setEditingChild(null);
        childForm.resetFields();
        setChildModalOpen(true);
    };

    const openEditChild = (child: FamilyChild) => {
        setEditingChild(child);
        childForm.setFieldsValue({
            name: child.name,
            age: child.age,
            date_of_birth: child.date_of_birth ? child.date_of_birth.substring(0, 10) : undefined,
        });
        setChildModalOpen(true);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <Spin size="large" />
                </div>
        );
    }

    if (!member) return null;

    const fullName = `${member.first_name} ${member.middle_name ? member.middle_name + ' ' : ''}${member.last_name}`;

    return (
        <div className="member-detail-container">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.back()}
                    style={{ marginBottom: '16px', paddingLeft: 0, color: '#1565c0' }}
                >
                    Back to Members
                </Button>

                <div className="content-card-unified">
                    {/* Unified Header Section */}
                    <div className="member-header-section">
                        <Avatar
                            size={120}
                            src={getImageUrl(member.image_url) ?? undefined}
                            className="member-profile-image"
                            style={{ fontSize: 42, fontWeight: 600, backgroundColor: '#1565c0', color: '#fff' }}
                        >
                            {getInitials(member.first_name, member.last_name, member.middle_name)}
                        </Avatar>
                        <div className="member-header-info">
                            <h1 className="member-name">{fullName}</h1>
                            <div className="member-role-tags">
                                <Tag
                                    icon={member.status === 'active' ? <CheckCircleOutlined /> : <UserOutlined />}
                                    color={member.status === 'active' ? 'success' : 'error'}
                                    style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '12px' }}
                                >
                                    {member.status === 'active' ? 'Active Member' : 'Inactive Member'}
                                </Tag>

                            </div>
                        </div>
                        <div className="member-actions-stacked">
                            <Button type="primary" icon={<PrinterOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => window.print()}>Print</Button>
                            <Button type="primary" icon={<EditOutlined />} size="middle" style={{ backgroundColor: '#2c73c5' }} onClick={() => router.push(`/members/edit/${id}`)}>Edit</Button>
                            <Popconfirm
                                title="Delete Member"
                                description="Are you sure you want to delete this member?"
                                onConfirm={handleDelete}
                                okText="Yes"
                                cancelText="No"
                                placement="bottomRight"
                            >
                                <Button type="primary" danger icon={<DeleteOutlined />} size="middle">Delete</Button>
                            </Popconfirm>
                        </div>
                    </div>

                    <div className="member-kpi-row">
                        <div className="member-kpi-card">
                            <Statistic
                                title="Visits"
                                value={member.visit_count ?? 0}
                                prefix={<HomeOutlined style={{ color: '#1565c0' }} />}
                            />
                        </div>
                        <div className="member-kpi-card">
                            <Statistic
                                title="Ministry interests"
                                value={member.interested_ministries?.length ?? 0}
                                prefix={<HeartOutlined style={{ color: '#1565c0' }} />}
                            />
                        </div>
                        <div className="member-kpi-card">
                            <Statistic
                                title="Ministries joined"
                                value={member.ministry_members?.length ?? 0}
                                prefix={<TeamOutlined style={{ color: '#1565c0' }} />}
                            />
                        </div>
                        <div className="member-kpi-card">
                            <Statistic
                                title="Family children"
                                value={family?.children?.length ?? 0}
                                prefix={<UserOutlined style={{ color: '#1565c0' }} />}
                            />
                        </div>
                    </div>

                    <div className="member-details-grid">
                            <div className="detail-section">
                                <h3><UserOutlined style={{ marginRight: 8, color: '#1565c0' }} />Personal</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><CalendarOutlined /> Date of Birth</th>
                                            <td>{member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Gender</th>
                                            <td style={{ textTransform: 'capitalize' }}>{member.gender || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Marital Status</th>
                                            <td style={{ textTransform: 'capitalize' }}>{member.marital_status || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Joined</th>
                                            <td>{member.joined_date ? new Date(member.joined_date).toLocaleDateString() : (member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <h3><PhoneOutlined style={{ marginRight: 8, color: '#1565c0' }} />Contact</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><MailOutlined /> Email</th>
                                            <td>{member.email || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><PhoneOutlined /> Phone</th>
                                            <td>{member.phone || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><EnvironmentOutlined /> Location</th>
                                            <td>{member.location?.name || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><EnvironmentOutlined /> Address</th>
                                            <td>{member.address || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <h3><GlobalOutlined style={{ marginRight: 8, color: '#1565c0' }} />Social Media</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th>Telegram</th>
                                            <td>{member.telegram_username ? `@${member.telegram_username}` : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>Facebook</th>
                                            <td>{member.facebook_username || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>Instagram</th>
                                            <td>{member.instagram_username || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>WhatsApp</th>
                                            <td>{member.whatsapp_number || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <h3><CheckCircleOutlined style={{ marginRight: 8, color: '#1565c0' }} />Spiritual</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th><IdcardOutlined /> Member Type</th>
                                            <td>
                                              {memberTypeLabel(member.member_type)}
                                              {member.requires_follow_up && (
                                                <Tag color="orange" style={{ marginLeft: 8 }}>Follow-up</Tag>
                                              )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><CheckCircleOutlined /> Water Baptized</th>
                                            <td>{yesNoTag(member.baptized)}</td>
                                        </tr>
                                        <tr>
                                            <th><CheckCircleOutlined /> Holy Spirit Baptized</th>
                                            <td>{yesNoTag(member.holy_spirit_baptized)}</td>
                                        </tr>
                                        <tr>
                                            <th><CalendarOutlined /> Salvation Date</th>
                                            <td>{member.salvation_date ? new Date(member.salvation_date).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th><FilePdfOutlined /> Recommendation Letter</th>
                                            <td>
                                                {member.recommendation_letter_url ? (
                                                  <a href={getImageUrl(member.recommendation_letter_url) ?? undefined} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                                                    View Document
                                                  </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section">
                                <h3><IdcardOutlined style={{ marginRight: 8, color: '#1565c0' }} />Professional</h3>
                                <table className="elegant-info-table">
                                    <tbody>
                                        <tr>
                                            <th>Employment</th>
                                            <td style={{ textTransform: 'capitalize' }}>{member.employment_status || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>Profession</th>
                                            <td>{member.profession || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>Employer</th>
                                            <td>{member.employer || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <th>Education</th>
                                            <td>
                                              {[member.education_level, member.education_field].filter(Boolean).join(' — ') || 'N/A'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="detail-section" id="member-family-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <TeamOutlined style={{ color: '#1565c0' }} /> Family
                                    </h3>
                                    {canManageFamily && (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <Button
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={openAddChild}
                                            >
                                                Add Child
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <table className="elegant-info-table" style={{ marginBottom: 16 }}>
                                    <tbody>
                                        <tr>
                                            <th><TeamOutlined /> Family</th>
                                            <td>
                                                {family ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <a
                                                            onClick={() => router.push(`/families/details/${family.id}`)}
                                                            style={{ color: '#1565c0', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            {family.name || 'Family Profile'}
                                                        </a>
                                                        {family.spouse_status === 'pending' && (
                                                            <Tag color="orange">Pending Spouse</Tag>
                                                        )}
                                                        {family.spouse_status === 'none' && (
                                                            <Tag color={(member.gender || '').toLowerCase() === 'female' ? 'magenta' : 'blue'}>
                                                                {(member.gender || '').toLowerCase() === 'female' ? 'Single mom' : 'Single dad'}
                                                            </Tag>
                                                        )}
                                                        {family.spouse_status === 'external' && (
                                                            <Tag color="cyan">External Spouse</Tag>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>Not created yet</span>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th><UserOutlined /> Spouse</th>
                                            <td>
                                                {(() => {
                                                    const isHusband = family?.husband_id === member.id && (family?.husband_type || 'member') === 'member';
                                                    const spouse = isHusband ? family?.wife : family?.husband;
                                                    const spouseId = isHusband ? family?.wife_id : family?.husband_id;
                                                    const spouseType = isHusband ? family?.wife_type : family?.husband_type;

                                                    if (spouse) {
                                                        const path = spouseType === 'minister'
                                                            ? `/ministers/details/${spouseId}`
                                                            : `/members/details/${spouseId}`;
                                                        return (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                <a
                                                                    onClick={() => router.push(path)}
                                                                    style={{ color: '#1565c0', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                                                >
                                                                    {leaderDisplayName(spouse)}
                                                                </a>
                                                            </div>
                                                        );
                                                    }

                                                    if (family?.spouse_status === 'external' && family.external_spouse_name) {
                                                        return (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                                <strong>{family.external_spouse_name}</strong>
                                                                <Tag color="cyan">External Spouse</Tag>
                                                                {family.external_spouse_phone && (
                                                                    <span style={{ color: '#64748b', fontSize: 13 }}>{family.external_spouse_phone}</span>
                                                                )}
                                                                {family.external_spouse_church && (
                                                                    <Tag>{family.external_spouse_church}</Tag>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    const isMarried = (member.marital_status || '').toLowerCase() === 'married';
                                                    return (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            {isMarried ? (
                                                                <Tag color="orange" icon={<InfoCircleOutlined />}>Pending Spouse</Tag>
                                                            ) : (
                                                                <Tag color="default">Unassigned</Tag>
                                                            )}
                                                            {canManageFamily && (
                                                                <Button
                                                                    size="small"
                                                                    type="primary"
                                                                    icon={<HeartOutlined />}
                                                                    style={{ background: '#1565c0', borderColor: '#1565c0' }}
                                                                    onClick={() => {
                                                                        spouseForm.resetFields();
                                                                        setSpouseModalOpen(true);
                                                                    }}
                                                                >
                                                                    {isMarried ? 'Link Spouse' : 'Add Spouse'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: 14, color: '#475569' }}>
                                        Children ({family?.children?.length ?? 0})
                                    </h4>
                                </div>

                                {(!family?.children || family.children.length === 0) ? (
                                    <div className="family-empty-box" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ color: '#64748b', fontSize: 13 }}>No children recorded for this family.</span>
                                    </div>
                                ) : (
                                    <div className="family-children-stack">
                                        {(family.children || []).map((child) => {
                                            const displayAge = child.date_of_birth
                                                ? (calculateAge(child.date_of_birth) ?? child.age)
                                                : child.age;
                                            return (
                                                <div key={child.id} className="family-child-item">
                                                    <div className="family-child-info">
                                                        <Avatar
                                                            size={34}
                                                            icon={<UserOutlined />}
                                                            style={{ background: '#dbeafe', color: '#1d4ed8' }}
                                                        />
                                                        <div>
                                                            <div className="family-child-name">
                                                                {child.name}
                                                            </div>
                                                            <div className="family-child-meta">
                                                                {displayAge !== undefined ? `${displayAge} ${displayAge === 1 ? 'yr' : 'yrs'} old` : 'Age not specified'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canManageFamily && (
                                                        <div className="family-child-actions">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<EditOutlined style={{ color: '#1565c0' }} />}
                                                                onClick={() => openEditChild(child)}
                                                                title="Edit child"
                                                            />
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleDeleteChild(child)}
                                                                title="Remove child"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="detail-section-pair">
                            <div className="detail-section">
                                <h3><TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />Ministry Interests</h3>
                                {(member.interested_ministries?.length ?? 0) === 0 ? (
                                    <Empty description="No ministry interests recorded." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {(member.interested_ministries || []).map((name) => (
                                            <Tag key={name} color="blue" style={{ padding: '4px 10px', fontSize: 13 }}>
                                                {name}
                                            </Tag>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="detail-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0 }}><TeamOutlined style={{ marginRight: '8px', color: '#1565c0' }} />Ministry Involvement ({member.ministry_members?.length || 0})</h3>
                                </div>

                                <div>
                                    {(member.ministry_members?.length ?? 0) === 0 ? (
                                        <Empty description="Not involved in any ministries." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    ) : (
                                        <div className="ministry-involvement-grid">
                                            {(member.ministry_members || []).map((mm) => {
                                                const isLeader = mm.ministry?.leader_id === member.id;
                                                return (
                                                    <Card
                                                        key={mm.ministry_id}
                                                        hoverable
                                                        className="member-card-elegant"
                                                        actions={[
                                                            <Tooltip key="view" title="View Ministry">
                                                                <Button
                                                                    type="text"
                                                                    icon={<InfoCircleOutlined style={{ color: '#1565c0', fontSize: '18px' }} />}
                                                                    onClick={() => router.push(`/ministries/details/${mm.ministry_id}`)}
                                                                />
                                                            </Tooltip>
                                                        ]}
                                                        styles={{ body: { padding: '20px', position: 'relative' } }}
                                                    >
                                                        <Tooltip title="Remove from Ministry">
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveMinistry(mm.ministry_id ?? '', mm.ministry?.name ?? 'Ministry');
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Card.Meta
                                                            avatar={<Avatar size={64} icon={<TeamOutlined />} style={{ border: '2px solid #f0f2f5', backgroundColor: '#e3f2fd', color: '#1565c0' }} />}
                                                            title={<span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--navy)' }}>{mm.ministry?.name}</span>}
                                                            description={
                                                                <div style={{ marginTop: '4px' }}>
                                                                    {isLeader && (
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <Tag
                                                                                icon={<UserOutlined />}
                                                                                color="#1565c0"
                                                                                style={{
                                                                                    fontWeight: 700,
                                                                                    borderRadius: '4px',
                                                                                    margin: '0 6px',
                                                                                    padding: '2px 10px',
                                                                                    fontSize: '11px',
                                                                                    letterSpacing: '0.05em',
                                                                                    textTransform: 'uppercase'
                                                                                }}
                                                                            >
                                                                                Ministry Leader
                                                                            </Tag>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                                                        <CalendarOutlined style={{ fontSize: '12px' }} />
                                                                        <span>{mm.ministry?.schedule || 'No schedule set'}</span>
                                                                    </div>
                                                                    <div style={{ marginTop: '8px' }}>
                                                                        <Tag color="blue" style={{ borderRadius: '4px', backgroundColor: '#e3f2fd', color: '#1565c0', borderColor: '#e3f2fd' }}>Joined: {mm.joined_at ? new Date(mm.joined_at).toLocaleDateString() : 'N/A'}</Tag>
                                                                    </div>
                                                                </div>
                                                            }
                                                        />
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                    </div>

                    {/* Print Signature Section (Hidden on screen) */}
                </div>

                {/* Link Spouse Modal */}
                <Modal
                    title={member.marital_status === 'married' ? 'Link Spouse' : 'Add Spouse'}
                    open={spouseModalOpen}
                    onCancel={() => setSpouseModalOpen(false)}
                    onOk={handleLinkSpouse}
                    confirmLoading={spouseSubmitting}
                    okText="Link Spouse"
                    destroyOnHidden
                    width={540}
                >
                    <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: 13 }}>
                        Assign a spouse from this church (member or minister) or register an external spouse. This will link your family record.
                    </p>
                    <Form form={spouseForm} layout="vertical" initialValues={{ spouse_type: 'church' }}>
                        <Form.Item name="spouse_type" label="Spouse Membership">
                            <Radio.Group style={{ width: '100%', display: 'flex', gap: 16 }}>
                                <Radio value="church">This Church (Member / Minister)</Radio>
                                <Radio value="external">External (Not in this church)</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, cur) => prev.spouse_type !== cur.spouse_type}
                        >
                            {({ getFieldValue }) => {
                                const isExternal = getFieldValue('spouse_type') === 'external';
                                if (isExternal) {
                                    return (
                                        <div className="external-spouse-form-fields">
                                            <Form.Item
                                                name="external_spouse_name"
                                                label="Spouse Full Name"
                                                rules={[{ required: true, message: 'Spouse name is required' }]}
                                            >
                                                <Input placeholder="Full name" size="large" />
                                            </Form.Item>
                                            <Form.Item name="external_spouse_phone" label="Phone Number">
                                                <Input placeholder="+251 9XX XXX XXXX" size="large" />
                                            </Form.Item>
                                            <Form.Item name="external_spouse_church" label="Local Church / Congregation">
                                                <Input placeholder="Church name" size="large" />
                                            </Form.Item>
                                        </div>
                                    );
                                }

                                const memberGender = (member.gender || '').toLowerCase();
                                const targetGender = memberGender === 'male' ? 'female' : memberGender === 'female' ? 'male' : undefined;

                                if (!targetGender) {
                                    return (
                                        <div style={{ padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, color: '#d46b08', fontSize: 13 }}>
                                            Member gender is not set. Please edit the member to set gender first before selecting a spouse.
                                        </div>
                                    );
                                }

                                return (
                                    <Form.Item
                                        name="internal_spouse_id"
                                        label="Select Spouse"
                                        rules={[{ required: true, message: 'Please select a spouse' }]}
                                    >
                                        <SpouseSelect gender={targetGender} excludeId={member.id} placeholder="Search candidate member or minister..." />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Add / Edit Child Modal */}
                <Modal
                    title={editingChild ? 'Edit Child' : 'Add Child'}
                    open={childModalOpen}
                    onCancel={() => {
                        setChildModalOpen(false);
                        setEditingChild(null);
                        childForm.resetFields();
                    }}
                    onOk={handleSaveChild}
                    confirmLoading={childSubmitting}
                    okText={editingChild ? 'Save Changes' : 'Add Child'}
                    destroyOnHidden
                    width={480}
                >
                    <Form
                        form={childForm}
                        layout="vertical"
                        style={{ marginTop: 12 }}
                        onValuesChange={(changedValues) => {
                            if (changedValues.date_of_birth) {
                                const computed = calculateAge(changedValues.date_of_birth);
                                if (computed !== undefined) {
                                    childForm.setFieldsValue({ age: computed });
                                }
                            }
                        }}
                    >
                        <Form.Item
                            name="name"
                            label="Child Full Name"
                            rules={[{ required: true, message: 'Child name is required' }]}
                        >
                            <Input placeholder="Child name" size="large" />
                        </Form.Item>
                        <Form.Item name="date_of_birth" label="Date of Birth">
                            <Input type="date" size="large" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="age" label="Age (Years)">
                            <InputNumber min={0} max={120} style={{ width: '100%' }} size="large" placeholder="Age in years (auto-calculated from DOB)" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
    );
};

export default MemberDetail;
