import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import './Subscription.css';
import Footer from '../../Components/Footer/Footer';
const { Title, Text, Paragraph } = Typography;

const plans = [
    {
        title: 'Starter',
        price: '$29',
        period: '/month',
        features: ['Up to 50 Members', 'Basic Reports', 'Email Support', '1 Admin User'],
        buttonText: 'Start Free Trial',
        popular: false,
    },
    {
        title: 'Growth',
        price: '$79',
        period: '/month',
        features: ['Up to 500 Members', 'Advanced Reports', 'Priority Support', '5 Admin Users', 'Event Management'],
        buttonText: 'Get Started',
        popular: true,
    },
    {
        title: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Unlimited Members', 'Custom Development', 'Dedicated Account Manager', 'SLA', 'Unlimited Admins'],
        buttonText: 'Contact Sales',
        popular: false,
    },
];

const Subscription = () => {
    const navigate = useNavigate();

    return (
        <div className="subscription-page">
            <div className="subscription-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={() => navigate('/')}
                    className="back-button"
                >
                    Back to Home
                </Button>
                <Title level={2} style={{ margin: 0 }}>Choose Your Plan</Title>
                <Paragraph type="secondary" style={{ fontSize: '16px', marginTop: '8px' }}>
                    Select the perfect plan for your church needs.
                </Paragraph>
            </div>

            <div className="plans-container">
                <Row gutter={[24, 24]} justify="center">
                    {plans.map((plan, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <Card
                                hoverable
                                className={`plan-card ${plan.popular ? 'popular-plan' : ''}`}
                                bordered={false}
                            >
                                {plan.popular && <div className="popular-tag">Most Popular</div>}
                                <div className="plan-header">
                                    <Title level={3}>{plan.title}</Title>
                                    <div className="plan-price">
                                        <Text className="currency">{plan.price}</Text>
                                        <Text type="secondary" className="period">{plan.period}</Text>
                                    </div>
                                </div>

                                <div className="plan-features">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="feature-item">
                                            <CheckCircleOutlined className="feature-icon" />
                                            <Text>{feature}</Text>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type={plan.popular ? 'primary' : 'default'}
                                    size="large"
                                    block
                                    className="plan-button"
                                >
                                    {plan.buttonText}
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
            <Footer />
        </div>
    );
};

export default Subscription;
