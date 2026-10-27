'use client';

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import {
  App,
  Badge,
  Button,
  Calendar,
  Form,
  Input,
  Modal,
  Select,
  Tag,
  TimePicker,
  DatePicker,
  Tabs,
} from 'antd';
import { message } from '@/lib/app-message';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { PermissionGate } from '@/Components/auth/PermissionGate';
import { useCan } from '@/Components/auth/Can';
import {
  createPlan,
  deletePlan,
  getMinisters,
  getPlanById,
  getPlans,
  getTasks,
  updatePlan,
} from '@/services/api';
import type { Minister, Plan, PlanStatus, PlanType, TaskAssignment } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';
import { useDebouncedCallback } from '@/lib/debounce';
import DataTable from '@/Components/common/DataTable';
import TableRowActions, { TABLE_ACTIONS_COLUMN } from '@/Components/common/TableRowActions';
import DataImportExport from '@/Components/common/DataImportExport';
import {
  downloadPlanTemplate,
  exportPlansExcel,
  exportPlansPdf,
  importPlansFromFile,
} from '@/lib/data-io/plans-io';
import './Planning.css';

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string; color: string }[] = [
  { value: 'program', label: 'Program', color: 'blue' },
  { value: 'crusade', label: 'Crusade', color: 'magenta' },
  { value: 'general_assembly', label: 'General Assembly', color: 'purple' },
  { value: 'training', label: 'Training', color: 'cyan' },
  { value: 'fasting_day', label: 'Fasting Day', color: 'orange' },
  { value: 'gospel_campaign', label: 'Gospel Campaign', color: 'green' },
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned', color: 'processing' },
  { value: 'completed', label: 'Achieved', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

const typeMeta = (type: PlanType) =>
  PLAN_TYPE_OPTIONS.find((o) => o.value === type) || PLAN_TYPE_OPTIONS[0];

function personName(p?: { first_name?: string; middle_name?: string; last_name?: string } | null) {
  if (!p) return '—';
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
}

function formatTime(t?: string | null) {
  if (!t) return null;
  return t.length > 5 ? t.slice(0, 5) : t;
}

function taskOnDay(task: TaskAssignment, day: string) {
  const start = String(task.start_date).slice(0, 10);
  const end = String(task.end_date).slice(0, 10);
  return start <= day && day <= end;
}

type FormValues = {
  title: string;
  type: PlanType;
  plan_date: Dayjs;
  time_range?: [Dayjs, Dayjs] | null;
  location?: string;
  notes?: string;
  status?: string;
  minister_ids?: string[];
};

const PlanningContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canCreate = useCan('plans.create');
  const canUpdate = useCan('plans.update');
  const canDelete = useCan('plans.delete');
  const { modal } = App.useApp();
  const canReadTasks = useCan('tasks.read');

  const [activeTab, setActiveTab] = useState('calendar');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [_loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [tableTotal, setTableTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [formSeed, setFormSeed] = useState<Partial<FormValues> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const from = calendarMonth.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
      const to = calendarMonth.endOf('month').add(7, 'day').format('YYYY-MM-DD');
      const [plansResult, tasksResult] = await Promise.all([
        getPlans({
          page: 1,
          limit: 100,
          from,
          to,
          type: typeFilter,
          status: statusFilter,
        }),
        canReadTasks
          ? getTasks({ page: 1, limit: 100, status: 'all' }).catch(() => ({ data: [] as TaskAssignment[] }))
          : Promise.resolve({ data: [] as TaskAssignment[] }),
      ]);
      setPlans(plansResult.data);
      // Keep tasks overlapping the visible month window
      setTasks(
        (tasksResult.data || []).filter((t) => {
          const start = String(t.start_date).slice(0, 10);
          const end = String(t.end_date).slice(0, 10);
          return end >= from && start <= to;
        }),
      );
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to load calendar'));
    } finally {
      setLoading(false);
    }
  }, [calendarMonth, typeFilter, statusFilter, canReadTasks]);

  const loadAllPlans = useCallback(
    async (page = tablePage, pageSize = tablePageSize, search = searchText) => {
      try {
        setTableLoading(true);
        const result = await getPlans({
          page,
          limit: pageSize,
          search: search || undefined,
          type: typeFilter,
          status: statusFilter,
        });
        setAllPlans(result.data);
        setTableTotal(result.total);
        setTablePage(result.page);
        setTablePageSize(result.limit);
      } catch (error: unknown) {
        message.error(getApiErrorMessage(error, 'Failed to load plans'));
      } finally {
        setTableLoading(false);
      }
    },
    [tablePage, tablePageSize, searchText, typeFilter, statusFilter],
  );

  useEffect(() => {
    if (activeTab === 'calendar') void loadCalendarData();
  }, [activeTab, loadCalendarData]);

  useEffect(() => {
    if (activeTab === 'list') void loadAllPlans(1, tablePageSize, searchText);
    // loadAllPlans identity changes with search; intentional one-shot on tab/filter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, typeFilter, statusFilter]);

  const debouncedListSearch = useDebouncedCallback((value: string) => {
    void loadAllPlans(1, tablePageSize, value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (activeTab === 'list') debouncedListSearch(value);
  };

  const filteredPlans = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) => p.title.toLowerCase().includes(q));
  }, [plans, searchText]);

  const filteredTasks = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.definition?.name || 'task').toLowerCase().includes(q));
  }, [tasks, searchText]);

  useEffect(() => {
    getMinisters({ page: 1, limit: 100 })
      .then((res) => setMinisters(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !canUpdate) return;
    let cancelled = false;
    (async () => {
      try {
        const plan = await getPlanById(editId);
        if (cancelled) return;
        openEdit(plan);
        router.replace('/planning');
      } catch {
        /* ignore missing plan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, canUpdate, router]);

  const openCreate = (date?: Dayjs) => {
    setEditing(null);
    setFormSeed({
      plan_date: date || selectedDate,
      type: 'program',
      status: 'planned',
      minister_ids: [],
      title: undefined,
      time_range: null,
      location: undefined,
      notes: undefined,
    });
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    const start = formatTime(plan.start_time);
    const end = formatTime(plan.end_time);
    setFormSeed({
      title: plan.title,
      type: plan.type,
      plan_date: dayjs(plan.plan_date),
      time_range:
        start && end
          ? [dayjs(start, 'HH:mm'), dayjs(end, 'HH:mm')]
          : start
            ? [dayjs(start, 'HH:mm'), dayjs(start, 'HH:mm')]
            : null,
      location: plan.location || undefined,
      notes: plan.notes || undefined,
      status: plan.status,
      minister_ids: (plan.plan_ministers || []).map((pm) => pm.minister_id),
    });
    setModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open && formSeed) {
      form.resetFields();
      form.setFieldsValue(formSeed);
      setFormSeed(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const range = values.time_range;
      const payload = {
        title: values.title.trim(),
        type: values.type,
        plan_date: values.plan_date.format('YYYY-MM-DD'),
        start_time: range?.[0] ? range[0].format('HH:mm') : null,
        end_time: range?.[1] ? range[1].format('HH:mm') : null,
        location: values.location?.trim() || null,
        notes: values.notes?.trim() || null,
        status: values.status || 'planned',
        minister_ids: values.minister_ids || [],
      };

      if (editing) {
        await updatePlan(editing.id, payload);
        message.success('Plan updated');
      } else {
        await createPlan(payload);
        message.success('Plan created');
      }
      setModalOpen(false);
      setEditing(null);
      setFormSeed(null);
      if (activeTab === 'calendar') await loadCalendarData();
      else await loadAllPlans(tablePage, tablePageSize, searchText);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getApiErrorMessage(error, 'Failed to save plan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    try {
      await deletePlan(plan.id);
      message.success('Plan deleted');
      if (activeTab === 'calendar') await loadCalendarData();
      else await loadAllPlans(tablePage, tablePageSize, searchText);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to delete plan'));
    }
  };

  const setPlanStatus = async (plan: Plan, status: PlanStatus) => {
    try {
      await updatePlan(plan.id, { status });
      const labels: Record<PlanStatus, string> = {
        planned: 'Plan activated',
        cancelled: 'Plan cancelled',
        completed: 'Plan marked as achieved',
      };
      message.success(labels[status]);
      if (activeTab === 'calendar') await loadCalendarData();
      else await loadAllPlans(tablePage, tablePageSize, searchText);
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, 'Failed to update plan status'));
    }
  };

  const confirmCancelPlan = (plan: Plan) => {
    modal.confirm({
      title: 'Cancel this plan?',
      content: 'It will be marked as cancelled and can be activated again later.',
      okText: 'Cancel plan',
      okType: 'danger',
      onOk: () => setPlanStatus(plan, 'cancelled'),
    });
  };

  const confirmDeletePlan = (plan: Plan) => {
    modal.confirm({
      title: 'Delete this plan?',
      okType: 'danger',
      onOk: () => handleDelete(plan),
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const key = value.format('YYYY-MM-DD');
    const dayPlans = filteredPlans.filter((p) => String(p.plan_date).slice(0, 10) === key);
    const dayTasks = filteredTasks.filter((t) => taskOnDay(t, key));
    const items: { id: string; color: string; text: string }[] = [
      ...dayPlans.map((p) => ({
        id: `plan-${p.id}`,
        color: typeMeta(p.type).color,
        text: p.title,
      })),
      ...dayTasks.map((t) => ({
        id: `task-${t.id}`,
        color: t.status === 'completed' ? 'green' : t.status === 'cancelled' ? 'gray' : 'gold',
        text: t.definition?.name || 'Task',
      })),
    ];
    if (!items.length) return null;
    return (
      <ul className="planning-events">
        {items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Badge color={item.color} text={item.text} />
          </li>
        ))}
        {items.length > 3 && (
          <li className="planning-events-more">+{items.length - 3} more</li>
        )}
      </ul>
    );
  };

  const tableColumns: ColumnsType<Plan> = [
    {
      title: 'Title',
      key: 'title',
      render: (_: unknown, record: Plan) => (
        <button
          type="button"
          className="planning-table-title-btn"
          onClick={() => router.push(`/planning/details/${record.id}`)}
        >
          {record.title}
        </button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      responsive: ['sm'],
      render: (type: PlanType) => {
        const meta = typeMeta(type);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: unknown, record: Plan) => dayjs(record.plan_date).format('MMM D, YYYY'),
    },
    {
      title: 'Time',
      key: 'time',
      responsive: ['md'],
      render: (_: unknown, record: Plan) => {
        const start = formatTime(record.start_time);
        const end = formatTime(record.end_time);
        if (!start) return '—';
        return end ? `${start}–${end}` : start;
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      responsive: ['lg'],
      render: (loc?: string | null) => loc || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      responsive: ['sm'],
      render: (status: string) => {
        const meta = STATUS_OPTIONS.find((s) => s.value === status);
        return (
          <Tag color={meta?.color || 'default'}>
            {status === 'completed' ? 'ACHIEVED' : (status || '').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Ministers',
      key: 'ministers',
      responsive: ['xl'],
      render: (_: unknown, record: Plan) => {
        const names = (record.plan_ministers || [])
          .map((pm) => personName(pm.minister))
          .filter((n) => n !== '—');
        return names.length ? names.join(', ') : '—';
      },
    },
    {
      title: 'Action',
            key: 'action',
            ...TABLE_ACTIONS_COLUMN,
      render: (_: unknown, record: Plan) => (
        <TableRowActions
          ariaLabel={`Actions for ${record.title}`}
          items={[
            {
              key: 'view',
              label: 'View details',
              icon: <InfoCircleOutlined style={{ color: '#1565c0' }} />,
              onClick: () => router.push(`/planning/details/${record.id}`),
            },
            ...(canUpdate
              ? [{
                  key: 'edit',
                  label: 'Edit',
                  icon: <EditOutlined />,
                  onClick: () => openEdit(record),
                }]
              : []),
            ...(canUpdate && record.status === 'planned'
              ? [
                  {
                    key: 'achieve',
                    label: 'Mark as achieved',
                    icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
                    onClick: () => setPlanStatus(record, 'completed'),
                  },
                  {
                    key: 'cancel',
                    label: 'Cancel plan',
                    icon: <StopOutlined />,
                    danger: true,
                    onClick: () => confirmCancelPlan(record),
                  },
                ]
              : []),
            ...(canUpdate && (record.status === 'cancelled' || record.status === 'completed')
              ? [{
                  key: 'activate',
                  label: 'Activate plan',
                  icon: <PlayCircleOutlined style={{ color: '#16a34a' }} />,
                  onClick: () => setPlanStatus(record, 'planned'),
                }]
              : []),
            ...(canDelete
              ? [{
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => confirmDeletePlan(record),
                }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="planning-container">
      <div className="planning-header">
        <div className="planning-header-text">
          <h2>Planning</h2>
          <p>Schedule programs and track assigned tasks on one calendar.</p>
        </div>
      </div>

      <div className="planning-toolbar planning-toolbar--inline">
        <Tabs
          className="planning-tabs-inline"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'calendar', label: 'Calendar' },
            { key: 'list', label: 'All Plans' },
          ]}
        />
        <div className="planning-toolbar-spacer" />
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            New Plan
          </Button>
        )}
      </div>

      <div className="planning-controls">
        <Input
          className="planning-search"
          placeholder="Search plans..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          allowClear
        />
        <div className="planning-controls-end">
          <Select
            allowClear
            placeholder="Type"
            className="planning-toolbar-filter"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            options={PLAN_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Select
            allowClear
            placeholder="Status"
            className="planning-toolbar-filter"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <DataImportExport
            entityLabel="Plans"
            canImport={canCreate}
            canExport
            onDownloadTemplate={downloadPlanTemplate}
            onExportExcel={exportPlansExcel}
            onExportPdf={exportPlansPdf}
            onImportFile={importPlansFromFile}
            onImportComplete={() => {
              if (activeTab === 'calendar') void loadCalendarData();
              else void loadAllPlans(1, tablePageSize, searchText);
            }}
          />
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <div className="planning-calendar-card">
          <Calendar
            value={selectedDate}
            onSelect={(date) => setSelectedDate(date)}
            onPanelChange={(date) => {
              setCalendarMonth(date);
              setSelectedDate(date);
            }}
            cellRender={(current, info) => {
              if (info.type === 'date') return dateCellRender(current);
              return info.originNode;
            }}
          />
        </div>
      ) : (
        <div className="manage-page">
          <DataTable
            columns={tableColumns}
            dataSource={allPlans}
            loading={tableLoading}
            rowKey="id"
            hideSearch
            searchPlaceholder="Search plans..."
            searchValue={searchText}
            onSearchChange={handleSearchChange}
            serverPagination={{
              current: tablePage,
              pageSize: tablePageSize,
              total: tableTotal,
              onChange: (page, pageSize) => loadAllPlans(page, pageSize, searchText),
            }}
            tableCardClassName="data-table-card"
          />
        </div>
      )}

      <Modal
        title={editing ? 'Edit Plan' : 'Create Plan'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          setFormSeed(null);
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editing ? 'Save' : 'Create'}
        width={560}
        destroyOnHidden
        afterOpenChange={handleModalOpenChange}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} preserve={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Enter a title' }]}>
            <Input placeholder="e.g. Youth Crusade" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Select a type' }]}>
            <Select options={PLAN_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Form.Item>
          <Form.Item name="plan_date" label="Date" rules={[{ required: true, message: 'Select a date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time_range" label="Time">
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="minister_ids" label="Ministers">
            <Select
              mode="multiple"
              showSearch
              placeholder="Assign ministers"
              optionFilterProp="label"
              options={ministers.map((m) => ({
                value: m.id,
                label: personName(m),
              }))}
            />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="Optional venue" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional details" />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="Status">
              <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

const Planning = () => (
  <PermissionGate permission="plans.read" pageLabel="Planning">
    <Suspense fallback={null}>
      <PlanningContent />
    </Suspense>
  </PermissionGate>
);

export default Planning;
