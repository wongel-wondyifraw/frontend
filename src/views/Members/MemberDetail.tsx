'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tag, Button, Spin, Avatar, Popconfirm, Card, Tooltip, Modal, Empty, Statistic } from 'antd';
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
} from '@ant-design/icons';
import { getMemberById, deleteMember, removeMinistryMember, getFamilyByMember } from '../../services/api';
import type { MemberDetailProps, Member, Family } from '@/types';
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
        Modal.confirm({
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

                            <div className="detail-section">
                                <h3><TeamOutlined style={{ marginRight: 8, color: '#1565c0' }} />Family</h3>
                                {!family ? (
                                    <Empty description="Not linked to a family yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    <>
                                        <table className="elegant-info-table" style={{ marginBottom: 16 }}>
                                            <tbody>
                                                <tr>
                                                    <th><UserOutlined /> Family</th>
                                                    <td>{family.name || 'Family'}</td>
                                                </tr>
                                                <tr>
                                                    <th><UserOutlined /> Spouse</th>
                                                    <td>
                                                        {(() => {
                                                            const isHusband = family.husband_id === member.id && (family.husband_type || 'member') === 'member';
                                                            const spouse = isHusband ? family.wife : family.husband;
                                                            const spouseId = isHusband ? family.wife_id : family.husband_id;
                                                            const spouseType = isHusband ? family.wife_type : family.husband_type;
                                                            if (!spouse) return 'N/A';
                                                            const path = spouseType === 'minister'
                                                              ? `/ministers/details/${spouseId}`
                                                              : `/members/details/${spouseId}`;
                                                            return (
                                                                <a
                                                                    onClick={() => router.push(path)}
                                                                    style={{ color: '#1565c0', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                                                                >
                                                                    {leaderDisplayName(spouse)}
                                                                    <Tag color={spouse.type === 'minister' ? 'purple' : 'blue'}>
                                                                      {spouse.type === 'minister' ? 'Minister' : 'Member'}
                                                                    </Tag>
                                                                    <Tag>{isHusband ? 'Wife' : 'Husband'}</Tag>
                                                                </a>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>
                                            Children ({family.children?.length ?? 0})
                                        </h4>
                                        {(family.children?.length ?? 0) === 0 ? (
                                            <Empty description="No children recorded." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {(family.children || []).map((child) => (
                                                    <Tag key={child.id} color="blue" style={{ padding: '4px 10px', fontSize: 13 }}>
                                                        {child.name} · {child.age} yrs
                                                    </Tag>
                                                ))}
                                            </div>
                                        )}
                                    </>
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
            </div>
    );
};

export default MemberDetail;
