'use client';

import React from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Radio,
  Row,
  Col,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import SpouseSelect from '@/Components/common/SpouseSelect';

/**
 * Marital/family fields for member Add/Edit wizards.
 * Expects parent Form context with: marital_status, gender, has_children,
 * children[], spouse_from_church, internal_spouse_id, external_spouse_*.
 */
export default function MemberFamilySection() {
  return (
    <Form.Item
      noStyle
      shouldUpdate={(prev, cur) =>
        prev.marital_status !== cur.marital_status ||
        prev.has_children !== cur.has_children ||
        prev.spouse_from_church !== cur.spouse_from_church ||
        prev.gender !== cur.gender
      }
    >
      {({ getFieldValue }) => {
        const status = getFieldValue('marital_status');
        const hasChildren = getFieldValue('has_children');
        const spouseFromChurch = getFieldValue('spouse_from_church');
        const gender = (getFieldValue('gender') || '').toLowerCase();
        const spouseGender = gender === 'male' ? 'female' : gender === 'female' ? 'male' : undefined;

        const showChildren =
          status === 'married' ||
          status === 'single' ||
          status === 'divorced' ||
          status === 'widowed';

        if (!status) return null;

        return (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 8 }}>
            {status === 'married' && (
              <>
                <Form.Item
                  name="spouse_from_church"
                  label="Is your spouse from this church?"
                  rules={[{ required: true, message: 'Please indicate spouse church membership' }]}
                >
                  <Radio.Group>
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </Radio.Group>
                </Form.Item>

                {spouseFromChurch === 'yes' && (
                  <Form.Item
                    label="Select Spouse"
                    name="internal_spouse_id"
                    rules={[{ required: true, message: 'Please select your spouse' }]}
                  >
                    {spouseGender ? (
                      <SpouseSelect gender={spouseGender} placeholder="Select member or minister" />
                    ) : (
                      <Select placeholder="Select gender first" disabled size="large" />
                    )}
                  </Form.Item>
                )}

                {spouseFromChurch === 'no' && (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Spouse Name"
                        name="external_spouse_name"
                        rules={[{ required: true, message: 'Spouse name is required' }]}
                      >
                        <Input size="large" placeholder="Full Name" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Spouse Phone" name="external_spouse_phone">
                        <Input size="large" placeholder="Phone Number" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Local Church" name="external_spouse_church">
                        <Input size="large" placeholder="Name of Church" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {showChildren && (
              <>
                <Form.Item
                  name="has_children"
                  valuePropName="checked"
                  style={{ marginBottom: hasChildren ? 16 : 0 }}
                >
                  <Checkbox>
                    {status === 'married' ? 'Have children together / in household?' : 'Have children?'}
                  </Checkbox>
                </Form.Item>

                {hasChildren && (
                  <Form.List name="children">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row gutter={16} key={key} style={{ marginBottom: 8 }} align="middle">
                            <Col span={10}>
                              <Form.Item
                                {...restField}
                                name={[name, 'name']}
                                rules={[{ required: true, message: 'Missing child name' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="Child Name" />
                              </Form.Item>
                            </Col>
                            <Col span={10}>
                              <Form.Item
                                {...restField}
                                name={[name, 'date_of_birth']}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker placeholder="Date of Birth" style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                            </Col>
                          </Row>
                        ))}
                        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Child
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                )}
              </>
            )}
          </div>
        );
      }}
    </Form.Item>
  );
}
