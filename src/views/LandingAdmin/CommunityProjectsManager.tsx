'use client';

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Table,
  Modal,
  Space,
  Select,
  DatePicker,
  Upload,
} from 'antd';
import { message } from '@/lib/app-message';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadMemberImage,
} from '@/services/api';
import type { CommunityProject } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm-delete';
import { getImageUrl } from '@/lib/media-url';

const { TextArea } = Input;

/** DB-backed community projects (status, dates) — shown on /projects. */
export default function CommunityProjectsManager() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<CommunityProject | null>(null);
  const [form] = Form.useForm();
  const imageUrl = Form.useWatch('image_url', form);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenModal = (project?: CommunityProject) => {
    setEditingProject(project || null);
    if (project) {
      form.setFieldsValue({
        ...project,
        start_date: project.start_date ? dayjs(project.start_date) : undefined,
        end_date: project.end_date ? dayjs(project.end_date) : undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'planned' });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };

      if (editingProject) {
        await updateProject(editingProject.id, payload);
        message.success('Project updated');
      } else {
        await createProject(payload);
        message.success('Project created');
      }
      setModalVisible(false);
      loadProjects();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save project'));
    }
  };

  const handleDelete = (id: string) => {
    confirmDelete({
      title: 'Delete this project?',
      content: 'This removes it from the public projects page.',
      onOk: async () => {
        try {
          await deleteProject(id);
          message.success('Project deleted');
          loadProjects();
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Failed to delete project'));
        }
      },
    });
  };

  const uploadImage = async (file: File) => {
    try {
      const url = await uploadMemberImage(file);
      form.setFieldValue('image_url', url);
      message.success('Image uploaded');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Image upload failed'));
    }
    return false;
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Start',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (val: string) => (val ? dayjs(val).format('MMM D, YYYY') : '—'),
    },
    {
      title: 'End',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (val: string) => (val ? dayjs(val).format('MMM D, YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: CommunityProject) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const preview = getImageUrl(imageUrl);

  return (
    <div>
      <div className="la-section">
        <div className="la-section-head">
          <div>
            <h3 className="la-section-title">Community projects</h3>
            <p className="la-section-sub">
              Projects with status and dates — listed on the public /projects page
            </p>
          </div>
        </div>
        <div className="la-section-body">
          <div className="la-actions-row" style={{ marginTop: 0, marginBottom: 14 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              Add project
            </Button>
          </div>
          <Table dataSource={projects} columns={columns} rowKey="id" loading={loading} />
        </div>
      </div>

      <Modal
        title={editingProject ? 'Edit project' : 'New project'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
        width={560}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="image_url" label="Image URL">
            <Input placeholder="Upload below or paste a URL" />
          </Form.Item>
          <div className="la-media-toolbar" style={{ marginBottom: 16 }}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={uploadImage}>
              <Button icon={<UploadOutlined />}>Upload image</Button>
            </Upload>
            {imageUrl && (
              <Button danger onClick={() => form.setFieldValue('image_url', null)}>
                Remove
              </Button>
            )}
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              style={{
                width: '100%',
                maxHeight: 160,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 16,
              }}
            />
          )}
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Planned', value: 'planned' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
              ]}
            />
          </Form.Item>
          <Form.Item name="start_date" label="Start date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="End date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
