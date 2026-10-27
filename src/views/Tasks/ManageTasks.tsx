'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Checkbox,
} from 'antd';
import { message } from '@/lib/app-message';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import DataTable from '../../Components/common/DataTable';
import DataTableFilterPopup from '../../Components/common/DataTableFilterPopup';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '../../Components/common/TableRowActions';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import {
  completeTask,
  createTask,
  createTaskDefinition,
  deleteTask,
  deleteTaskDefinition,
  getTaskDefinitions,
  getMinisters,
  getTasks,
  updateTaskDefinition,
} from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import type { Minister, TaskAssignment, TaskDefinition } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import MemberSearchSelect from '../../Components/common/MemberSearchSelect';
import './ManageTasks.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue' | 'cancelled';

function personName(p?: { first_name?: string; middle_name?: string; last_name?: string } | null) {
  if (!p) return '-';
  return `${p.first_name || ''} ${p.middle_name ? `${p.middle_name} ` : ''}${p.last_name || ''}`.trim() || '-';
}

function statusTag(task: TaskAssignment) {
  const today = dayjs().format('YYYY-MM-DD');
  if (task.status === 'completed') return <Tag color="success">Completed</Tag>;
  if (task.status === 'cancelled') return <Tag>Cancelled</Tag>;
  if (task.status === 'pending' && task.end_date < today) return <Tag color="error">Overdue</Tag>;
  return <Tag color="processing">Pending</Tag>;
}

const ManageTasksContent = () => {
  const canCreate = useCan('tasks.create');
  const canUpdate = useCan('tasks.update');
  const canDelete = useCan('tasks.delete');
  const { modal } = App.useApp();

  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [definitions, setDefinitions] = useState<TaskDefinition[]>([]);
  const [ministers, setMinisters] = useState<Minister[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignForm] = Form.useForm();
  const selectedDefinitionId = Form.useWatch('definition_id', assignForm);

  const [defsOpen, setDefsOpen] = useState(false);
  const [defForm] = Form.useForm();
  const [editingDef, setEditingDef] = useState<TaskDefinition | null>(null);
  const [defSubmitting, setDefSubmitting] = useState(false);

  const selectedDefinition = useMemo(
    () => definitions.find((d) => d.id === selectedDefinitionId),
    [definitions, selectedDefinitionId],
  );

  const loadTasks = useCallback(async (
    nextPage = page,
    nextPageSize = pageSize,
    search = searchText,
    nextStatus = status,
    nextAssigneeId = assigneeId,
  ) => {
    try {
      setLoading(true);
      const result = await getTasks({
        page: nextPage,
        limit: nextPageSize,
        search: search || undefined,
        status: nextStatus,
        minister_id: nextAssigneeId,
      });
      setTasks(result.data);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, status, assigneeId]);

  const loadLookups = useCallback(async () => {
    const results = await Promise.allSettled([
      getTaskDefinitions(false),
      getMinisters({ page: 1, limit: 100 }),
    ]);

    const [defsResult, ministersResult] = results;
    let failed = false;

    if (defsResult.status === 'fulfilled') {
      setDefinitions(defsResult.value);
    } else {
      failed = true;
      setDefinitions([]);
    }

    if (ministersResult.status === 'fulfilled') {
      setMinisters(ministersResult.value.data);
    } else {
      failed = true;
      setMinisters([]);
    }

    if (failed) {
      message.error('Failed to load some task options');
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadTasks(1, pageSize, value, status, assigneeId);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatus(next);
    loadTasks(1, pageSize, searchText, next, assigneeId);
  };

  const handleAssigneeChange = (next?: string) => {
    setAssigneeId(next);
    loadTasks(1, pageSize, searchText, status, next);
  };

  const clearFilters = () => {
    setStatus('all');
    setAssigneeId(undefined);
    loadTasks(1, pageSize, searchText, 'all', undefined);
  };

  const activeFilterCount =
    (status !== 'all' ? 1 : 0) + (assigneeId ? 1 : 0);

  const filterPanel = (
    <DataTableFilterPopup
      activeCount={activeFilterCount}
      onClear={clearFilters}
    >
      <div className="dt-filter-field">
        <span className="dt-filter-label">Status</span>
        <Select
          value={status}
          onChange={handleStatusChange}
          options={[
            { value: 'all', label: 'All tasks' },
            { value: 'pending', label: 'Pending' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
      <div className="dt-filter-field">
        <span className="dt-filter-label">Assignee</span>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Any minister"
          value={assigneeId}
          onChange={(value) => handleAssigneeChange(value || undefined)}
          options={ministers.map((m) => ({
            value: m.id,
            label: personName(m),
          }))}
        />
      </div>
    </DataTableFilterPopup>
  );

  const openAssign = () => {
    setAssignOpen(true);
  };

  const syncAssignForm = (open: boolean) => {
    if (!open) return;
    assignForm.resetFields();
    const homeVisit = definitions.find((d) => d.code === 'HOME_VISIT' && d.is_active);
    if (homeVisit) {
      assignForm.setFieldsValue({ definition_id: homeVisit.id });
    }
  };

  const submitAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      const range = values.date_range as [Dayjs, Dayjs];
      setAssignSubmitting(true);
      await createTask({
        definition_id: values.definition_id,
        minister_id: values.minister_id,
        target_member_id: values.target_member_id,
        start_date: range[0].format('YYYY-MM-DD'),
        end_date: range[1].format('YYYY-MM-DD'),
        notes: values.notes || undefined,
        visitation_methods: values.visitation_methods || [],
      });
      message.success('Task assigned');
      setAssignOpen(false);
      loadTasks(1, pageSize, searchText, status);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to assign task'));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleComplete = (task: TaskAssignment) => {
    modal.confirm({
      title: 'Mark task completed?',
      content: `${task.definition?.name || 'Task'} will be marked as completed.`,
      okText: 'Complete',
      onOk: async () => {
        try {
          await completeTask(task.id);
          message.success('Task completed');
          loadTasks(page, pageSize, searchText, status);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to complete task'));
        }
      },
    });
  };

  const handleDeleteTask = (task: TaskAssignment) => {
    modal.confirm({
      title: 'Delete task?',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      content: 'This removes the assignment permanently.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteTask(task.id);
          message.success('Task deleted');
          loadTasks(page, pageSize, searchText, status);
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete task'));
        }
      },
    });
  };

  const openCreateDefinition = () => {
    setEditingDef(null);
    if (defsOpen) {
      defForm.resetFields();
      defForm.setFieldsValue({ is_active: true, requires_visit_target: false });
    }
  };

  const openEditDefinition = (def: TaskDefinition) => {
    setEditingDef(def);
    if (defsOpen) {
      defForm.setFieldsValue({
        name: def.name,
        description: def.description || '',
        requires_visit_target: def.requires_visit_target,
        is_active: def.is_active,
      });
    }
  };

  const syncDefinitionForm = (open: boolean) => {
    if (!open) return;
    if (editingDef) {
      defForm.setFieldsValue({
        name: editingDef.name,
        description: editingDef.description || '',
        requires_visit_target: editingDef.requires_visit_target,
        is_active: editingDef.is_active,
      });
    } else {
      defForm.resetFields();
      defForm.setFieldsValue({ is_active: true, requires_visit_target: false });
    }
  };

  const submitDefinition = async () => {
    try {
      const values = await defForm.validateFields();
      setDefSubmitting(true);
      if (editingDef) {
        await updateTaskDefinition(editingDef.id, {
          name: values.name,
          description: values.description || undefined,
          requires_visit_target: editingDef.is_system ? undefined : values.requires_visit_target,
          is_active: values.is_active,
        });
        message.success('Definition updated');
      } else {
        await createTaskDefinition({
          name: values.name,
          description: values.description || undefined,
          requires_visit_target: values.requires_visit_target,
          is_active: values.is_active,
        });
        message.success('Definition created');
      }
      setEditingDef(null);
      defForm.resetFields();
      defForm.setFieldsValue({ is_active: true, requires_visit_target: false });
      await loadLookups();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save definition'));
    } finally {
      setDefSubmitting(false);
    }
  };

  const handleDeleteDefinition = (def: TaskDefinition) => {
    if (def.is_system) {
      message.warning('System definitions cannot be deleted');
      return;
    }
    modal.confirm({
      title: 'Delete definition?',
      content: `Delete "${def.name}"? Only possible if no tasks use it.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteTaskDefinition(def.id);
          message.success('Definition deleted');
          if (editingDef?.id === def.id) {
            setEditingDef(null);
            defForm.resetFields();
          }
          await loadLookups();
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, 'Failed to delete definition'));
        }
      },
    });
  };

  const activeDefinitions = definitions.filter((d) => d.is_active);

  const columns: ColumnsType<TaskAssignment> = [
    {
      title: 'Task',
      key: 'task',
      render: (_: unknown, record: TaskAssignment) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar icon={<UnorderedListOutlined />} style={{ backgroundColor: '#1565c0' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.definition?.name || 'Task'}</div>
            {record.notes && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{record.notes}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Assigned to',
      key: 'minister',
      responsive: ['sm'],
      render: (_: unknown, record: TaskAssignment) => personName(record.minister),
    },
    {
      title: 'Visit / Target',
      key: 'target',
      responsive: ['md'],
      render: (_: unknown, record: TaskAssignment) =>
        record.definition?.requires_visit_target ? personName(record.target_member) : '—',
    },
    {
      title: 'Date range & Methods',
      key: 'dates',
      responsive: ['lg'],
      render: (_: unknown, record: TaskAssignment) => (
        <div>
          <span>
            {dayjs(record.start_date).format('MMM D, YYYY')} → {dayjs(record.end_date).format('MMM D, YYYY')}
          </span>
          {record.visitation_methods && record.visitation_methods.length > 0 && (
            <div style={{ marginTop: 4 }}>
                {record.visitation_methods.map(m => (
                    <Tag key={m} color="blue">{m}</Tag>
                ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: unknown, record: TaskAssignment) => statusTag(record),
    },
    {
      title: 'Action',
            key: 'action',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: TaskAssignment) => (
        <TableRowActions
          ariaLabel={`Actions for ${record.definition?.name || 'task'}`}
          items={[
            ...(canUpdate && record.status === 'pending'
              ? [{
                  key: 'complete',
                  label: 'Mark completed',
                  icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
                  onClick: () => handleComplete(record),
                }]
              : []),
            ...(canDelete
              ? [{
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteTask(record),
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="manage-page">
      <DataTable
        title="Task Management"
        subtitle="Assign work, track progress, and manage task definitions."
        columns={columns}
        dataSource={tasks}
        loading={loading}
        searchPlaceholder="Search tasks, ministers..."
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        filterPanel={filterPanel}
        controlsEnd={
          <>
            {canCreate ? (
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  setEditingDef(null);
                  setDefsOpen(true);
                }}
              >
                Definitions
              </Button>
            ) : null}
            {canCreate ? (
              <Button type="primary" className="data-table-action" icon={<PlusOutlined />} onClick={openAssign}>
                Assign Task
              </Button>
            ) : null}
          </>
        }
        serverPagination={{
          current: page,
          pageSize,
          total,
          onChange: (nextPage, nextSize) =>
            loadTasks(nextPage, nextSize, searchText, status, assigneeId),
        }}
        tableCardClassName="data-table-card"
      />

      <Modal
        title="Assign Task"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={submitAssign}
        confirmLoading={assignSubmitting}
        okText="Assign"
        destroyOnHidden
        afterOpenChange={syncAssignForm}
        width={560}
      >
        <Form form={assignForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="definition_id"
            label="Task definition"
            rules={[{ required: true, message: 'Select a task type' }]}
          >
            <Select
              placeholder="Select task type"
              options={activeDefinitions.map((d) => ({
                value: d.id,
                label: d.is_system ? `${d.name} (system)` : d.name,
              }))}
              onChange={() => assignForm.setFieldValue('target_member_id', undefined)}
            />
          </Form.Item>

          {selectedDefinition?.requires_visit_target && (
            <>
              <Form.Item
                name="target_member_id"
                label="Who to visit"
                rules={[{ required: true, message: 'Select the member to visit' }]}
                extra="Type to search — results sorted by visit count when available."
              >
                <MemberSearchSelect
                  placeholder="Type to search member to visit"
                  optionExtra={(m) =>
                    ` — ${m.visit_count || 0} visit${(m.visit_count || 0) === 1 ? '' : 's'}`
                  }
                  sortBy={(a, b) => (b.visit_count || 0) - (a.visit_count || 0)}
                />
              </Form.Item>
              <Form.Item name="visitation_methods" label="Visitation method(s)">
                <Checkbox.Group options={['Home', 'Office', 'Phone']} />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="minister_id"
            label="Assign to minister"
            rules={[{ required: true, message: 'Select a minister' }]}
          >
            <Select
              showSearch
              placeholder="Select minister"
              optionFilterProp="label"
              options={ministers.map((m) => ({
                value: m.id,
                label: personName(m),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="date_range"
            label="Date range"
            rules={[{ required: true, message: 'Select start and end dates' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Task Definitions"
        open={defsOpen}
        onClose={() => setDefsOpen(false)}
        size={440}
        destroyOnHidden
        afterOpenChange={syncDefinitionForm}
      >
        <Form form={defForm} layout="vertical" onFinish={submitDefinition}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Follow-up call" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="What this task means" />
          </Form.Item>
          <Form.Item
            name="requires_visit_target"
            label="Requires visit target"
            valuePropName="checked"
            extra={editingDef?.is_system ? 'Home Visit always requires a visit target.' : undefined}
          >
            <Switch disabled={!!editingDef?.is_system} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space style={{ marginBottom: 24 }}>
            <Button type="primary" htmlType="submit" loading={defSubmitting}>
              {editingDef ? 'Update' : 'Create'} definition
            </Button>
            {editingDef && (
              <Button onClick={openCreateDefinition}>New</Button>
            )}
          </Space>
        </Form>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
          <h4 style={{ marginTop: 0 }}>Existing definitions</h4>
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {definitions.map((def) => (
              <div
                key={def.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {def.name}{' '}
                    {def.is_system && <Tag color="blue">System</Tag>}
                    {!def.is_active && <Tag>Inactive</Tag>}
                  </div>
                  {def.description && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>{def.description}</div>
                  )}
                </div>
                <Space>
                  <Button size="small" onClick={() => openEditDefinition(def)}>Edit</Button>
                  {!def.is_system && canDelete && (
                    <Button size="small" danger onClick={() => handleDeleteDefinition(def)}>
                      Delete
                    </Button>
                  )}
                </Space>
              </div>
            ))}
          </Space>
        </div>
      </Drawer>
    </div>
  );
};

const ManageTasks = () => (
  <PermissionGate permission="tasks.read">
    <ManageTasksContent />
  </PermissionGate>
);

export default ManageTasks;
