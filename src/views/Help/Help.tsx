'use client';
import React from 'react';
import { Input, Collapse, Button, Card, Row, Col } from 'antd';
import { SearchOutlined, QuestionCircleOutlined, MailOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';
import './Help.css';

const { Panel } = Collapse;

const Help = () => {
    return (
        <div className="help-container">
                <div className="help-header">
                    <h2>How can we help you?</h2>
                    <p>Search our knowledge base or browse common questions below.</p>
                    <div className="help-search-wrapper">
                        <Input
                            size="large"
                            placeholder="Search for articles..."
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            style={{ borderRadius: '12px' }}
                        />
                    </div>
                </div>

                <div className="help-content">
                    <div className="faq-section">
                        <h3><QuestionCircleOutlined /> Frequently Asked Questions</h3>
                        <Collapse defaultActiveKey={['1']} ghost>
                            <Panel header="How do I add a new member?" key="1">
                                <p>{'To add a new member, navigate to the Members page from the sidebar. Click the "Add Member" button in the top right corner. Fill out the required information in the form and click "Save".'}</p>
                            </Panel>
                            <Panel header="Can I export membership data?" key="2">
                                <p>{'Yes, you can export data. Go to the Settings page and look for the \'Data Export\' section. You can download your data in CSV or Excel format.'}</p>
                            </Panel>
                            <Panel header="How do I create a new ministry group?" key="3">
                                <p>{'Navigate to Ministries > Manage Ministries. Click "Add Ministry", assign a leader, and set the meeting schedule. Once created, you can add members to the group.'}</p>
                            </Panel>
                            <Panel header="I forgot my password, what should I do?" key="4">
                                <p>{'If you\'re logged out, use the "Forgot Password" link on the login page. If you\'re logged in, you can change your password in the Settings > Security tab.'}</p>
                            </Panel>
                        </Collapse>
                    </div>
                </div>

                <div className="contact-support">
                    <h3>Still need support?</h3>
                    <p>Our team is available 24/7 to help you with any issues.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <Button type="primary" size="large" icon={<MessageOutlined />} style={{ background: '#1565c0' }}>
                            Live Chat
                        </Button>
                        <Button size="large" icon={<MailOutlined />} ghost>
                            Email Us
                        </Button>
                    </div>
                </div>
            </div>
    );
};

export default Help;
