import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Modal, Space, Select, DatePicker, message, Card, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPageContent, updatePageContent, getProjects, createProject, updateProject, deleteProject } from '../../../services/api';
import type { PageContent, CommunityProject } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

const { TextArea } = Input;

const PageEditor = ({ slug, label }: { slug: string; label: string }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getPageContent(slug);
      form.setFieldsValue({ content: data.content });
    } catch (error) {
      console.log(`No existing content for ${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await updatePageContent(slug, { content: values.content });
      message.success(`${label} page content updated successfully`);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to update page content'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={`Edit ${label} Page`} loading={loading} style={{ maxWidth: 800 }}>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item name="content" label="Page Content (Markdown / Text)" rules={[{ required: true }]}>
          <TextArea rows={15} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>Save Content</Button>
      </Form>
    </Card>
  );
};

const ProjectsManager = () => {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<CommunityProject | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(getApiErrorMessage(error, 'Failed to save project'));
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Project?',
      content: 'Are you sure you want to delete this project?',
      okText: 'Yes',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(id);
          message.success('Project deleted');
          loadProjects();
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Failed to delete project'));
        }
      }
    });
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Start Date', dataIndex: 'start_date', key: 'start_date', render: (val: string) => val ? dayjs(val).format('MMM D, YYYY') : '-' },
    { title: 'End Date', dataIndex: 'end_date', key: 'end_date', render: (val: string) => val ? dayjs(val).format('MMM D, YYYY') : '-' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CommunityProject) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Add Project</Button>
      </Space>
      <Table dataSource={projects} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingProject ? 'Edit Project' : 'New Project'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="image_url" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Planned', value: 'planned' },
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
            ]} />
          </Form.Item>
          <Form.Item name="start_date" label="Start Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="End Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const WebsiteManagementTab = () => {
  const items = [
    { key: 'about', label: 'About Page', children: <PageEditor slug="about" label="About" /> },
    { key: 'vision', label: 'Vision Page', children: <PageEditor slug="vision" label="Vision" /> },
    { key: 'contact', label: 'Contact Page', children: <PageEditor slug="contact" label="Contact" /> },
    { key: 'projects', label: 'Community Projects', children: <ProjectsManager /> },
  ];

  return <Tabs items={items} />;
};

export default WebsiteManagementTab;
