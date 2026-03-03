import React from "react";
import { Layout, Row, Col, Typography, Input, Button, Space } from "antd";
import "./Footer.css";

const { Footer } = Layout;
const { Title, Text } = Typography;

const AppFooter = () => {
  return (
    <Footer className="footer-section">
      <div className="footer-content">
        <Row gutter={[32, 32]}>
          {/* About */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">About Us</Title>
            <Text className="footer-text">
              Our church management platform helps streamline operations,
              engage members, and grow ministries effectively.
            </Text>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Quick Links</Title>
            <Space direction="vertical">
              <a href="#">Home</a>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Contact</a>
            </Space>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Contact Us</Title>
            <Space direction="vertical">
              <Text>Email: info@churchapp.com</Text>
              <Text>Phone: +251 900 000 000</Text>
              <Text>Address: Addis Ababa, Ethiopia</Text>
            </Space>
          </Col>

          {/* Newsletter */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="footer-title">Newsletter</Title>
            <Text className="footer-text">
              Subscribe to receive daily verses and updates.
            </Text>

            <Space direction="vertical" style={{ width: "100%" }}>
              <Input placeholder="Enter your email" />
              <Button type="primary" block>
                Subscribe
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Bottom */}
        <div className="footer-bottom">
          © {new Date().getFullYear()} Church Management Solutions.
          All rights reserved.
        </div>
      </div>
    </Footer>
  );
};

export default AppFooter;
