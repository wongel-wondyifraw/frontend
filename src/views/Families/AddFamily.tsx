'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Select, Row, Col } from 'antd';
import { ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { createFamily } from '../../services/api';
import { getApiErrorMessage } from '@/lib/errors';
import SpouseSelect, { decodeLeaderValue } from '../../Components/common/SpouseSelect';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import './AddFamily.css';

const { Option } = Select;

const AddFamilyContent = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Watch status to toggle required fields
  const husbandStatus = Form.useWatch('husband_status', form);
  const wifeStatus = Form.useWatch('wife_status', form);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      let husbandId: string | undefined = undefined;
      let husbandType: string | undefined = undefined;
      let wifeId: string | undefined = undefined;
      let wifeType: string | undefined = undefined;

      if (values.husband_status === 'registered') {
        const husband = decodeLeaderValue(values.husband);
        if (!husband.leader_id || !husband.leader_type) {
            message.error('Select registered husband');
            return;
        }
        husbandId = husband.leader_id;
        husbandType = husband.leader_type;
      }

      if (values.wife_status === 'registered') {
        const wife = decodeLeaderValue(values.wife);
        if (!wife.leader_id || !wife.leader_type) {
            message.error('Select registered wife');
            return;
        }
        wifeId = wife.leader_id;
        wifeType = wife.leader_type;
      }

      if (husbandId && wifeId && husbandId === wifeId && husbandType === wifeType) {
        message.error('Husband and wife must be different people');
        return;
      }

      setLoading(true);
      const created = await createFamily({
        name: values.name || undefined,
        notes: values.notes || undefined,
        husband_id: husbandId,
        husband_type: husbandType,
        husband_status: values.husband_status,
        wife_id: wifeId,
        wife_type: wifeType,
        wife_status: values.wife_status,
      });
      message.success('Family created.');
      router.push(`/families/details/${created.id}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to create family'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-ministry-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/families')}
        style={{ marginBottom: 16, paddingLeft: 0, color: '#1565c0' }}
      >
        Back to Families
      </Button>

      <div className="add-ministry-card">
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#1565c0' }} /> Create Family
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Select husband and wife from male and female members or ministers. You can also specify if they are non-members, pending, or external.
        </p>

        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ husband_status: 'registered', wife_status: 'registered' }}>
          <Form.Item name="name" label="Family name">
            <Input size="large" placeholder="Optional — defaults to spouse last name" />
          </Form.Item>

          <Row gutter={16}>
              <Col span={8}>
                  <Form.Item name="husband_status" label="Husband Status">
                      <Select size="large">
                          <Option value="registered">Registered</Option>
                          <Option value="non_member">Non-member</Option>
                          <Option value="pending">Pending</Option>
                          <Option value="external">External</Option>
                      </Select>
                  </Form.Item>
              </Col>
              <Col span={16}>
                {husbandStatus === 'registered' ? (
                  <Form.Item
                    name="husband"
                    label="Husband"
                    rules={[{ required: true, message: 'Select husband' }]}
                  >
                    <SpouseSelect gender="male" placeholder="Select husband" />
                  </Form.Item>
                ) : (
                    <Form.Item label="Husband" extra="No member record linked.">
                        <Input size="large" disabled value="Not Registered" />
                    </Form.Item>
                )}
              </Col>
          </Row>

          <Row gutter={16}>
              <Col span={8}>
                  <Form.Item name="wife_status" label="Wife Status">
                      <Select size="large">
                          <Option value="registered">Registered</Option>
                          <Option value="non_member">Non-member</Option>
                          <Option value="pending">Pending</Option>
                          <Option value="external">External</Option>
                      </Select>
                  </Form.Item>
              </Col>
              <Col span={16}>
                {wifeStatus === 'registered' ? (
                  <Form.Item
                    name="wife"
                    label="Wife"
                    rules={[{ required: true, message: 'Select wife' }]}
                  >
                    <SpouseSelect gender="female" placeholder="Select wife" />
                  </Form.Item>
                ) : (
                    <Form.Item label="Wife" extra="No member record linked.">
                        <Input size="large" disabled value="Not Registered" />
                    </Form.Item>
                )}
              </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button onClick={() => router.push('/families')}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#1565c0' }}>
              Create Family
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

const AddFamily = () => (
  <PermissionGate permission="families.create">
    <AddFamilyContent />
  </PermissionGate>
);

export default AddFamily;
