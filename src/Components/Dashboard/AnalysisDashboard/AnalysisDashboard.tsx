'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Row,
  Statistic,
  Progress,
  Tabs,
  Radio,
  Select,
  Tooltip,
  Typography,
  Empty,
} from 'antd';
import {
  InfoCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboardStats } from '@/context/DashboardStatsContext';
import { getMembers } from '@/services/api';
import type { Member } from '@/types';
import TodoList from '@/Components/Dashboard/Widgets/TodoList/TodoList';
import UpcomingPrograms from '@/Components/Dashboard/Widgets/UpcomingPrograms/UpcomingPrograms';
import './AnalysisDashboard.css';

const { Text, Title } = Typography;

const BRAND = '#1E40AF';
const BRAND_SOFT = '#93c5fd';
const PIE_COLORS = ['#1E40AF', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1e3a8a', '#2563eb'];

function formatMemberName(m: { first_name: string; last_name: string; middle_name?: string }) {
  return [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ');
}

function formatJoinedLabel(iso?: string) {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pctChange(current: number, previous: number): { up: boolean; label: string } {
  if (previous <= 0) {
    if (current <= 0) return { up: true, label: '0%' };
    return { up: true, label: '100%' };
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  return { up: delta >= 0, label: `${Math.abs(delta)}%` };
}

function Trend({ up, label, value }: { up?: boolean; label: string; value: string }) {
  return (
    <span className="ad-trend">
      <Text type="secondary">{label}</Text>
      {up ? <CaretUpOutlined className="ad-trend-up" /> : <CaretDownOutlined className="ad-trend-down" />}
      <Text className={up ? 'ad-trend-up' : 'ad-trend-down'}>{value}</Text>
    </span>
  );
}

function IntroduceCard({
  title,
  tip,
  total,
  footer,
  children,
}: {
  title: string;
  tip: string;
  total: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="ad-intro-card" variant="borderless">
      <div className="ad-intro-top">
        <Text type="secondary">{title}</Text>
        <Tooltip title={tip}>
          <InfoCircleOutlined className="ad-intro-info" />
        </Tooltip>
      </div>
      <div className="ad-intro-total">{total}</div>
      <div className="ad-intro-body">{children}</div>
      <div className="ad-intro-footer">{footer}</div>
    </Card>
  );
}

function SparkArea({ data, color = BRAND }: { data: number[]; color?: string }) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={46}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SparkBars({ data }: { data: number[] }) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={46}>
      <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey="value" fill={BRAND_SOFT} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function AnalysisDashboard() {
  const stats = useDashboardStats();
  const [range, setRange] = useState('year');
  const [pieFilter, setPieFilter] = useState('all');
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);

  const members = stats?.memberCount ?? 0;
  const active = stats?.activeMembers ?? 0;
  const inactive = stats?.inactiveMembers ?? 0;
  const membersMonth = stats?.membersThisMonth ?? 0;
  const membersWeek = stats?.membersThisWeek ?? 0;
  const membersLastWeek = stats?.membersLastWeek ?? 0;
  const ministers = stats?.ministerCount ?? 0;
  const activeMinisters = stats?.activeMinisters ?? 0;
  const ministries = stats?.ministryCount ?? 0;
  const withLeader = stats?.ministriesWithLeader ?? 0;
  const leaderPct = ministries > 0 ? Math.round((withLeader / ministries) * 100) : 0;
  const spark = stats?.registrationSpark?.length
    ? stats.registrationSpark
    : Array.from({ length: 12 }, () => 0);

  const wow = pctChange(membersWeek, membersLastWeek);

  useEffect(() => {
    let cancelled = false;
    getMembers({ page: 1, limit: 100 })
      .then((res) => {
        if (!cancelled) setRecentMembers(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setRecentMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const registrationChart = useMemo(() => {
    if (stats?.registrationsByMonth?.length) {
      return stats.registrationsByMonth;
    }
    return [];
  }, [stats?.registrationsByMonth]);

  const filteredRegistrationChart = useMemo(() => {
    if (range === 'year') return registrationChart;
    const now = new Date();
    const month = now.getMonth();
    if (range === 'month') return registrationChart.filter((_, i) => i === month);
    if (range === 'week' || range === 'day') {
      // No daily series yet — show current month only
      return registrationChart.filter((_, i) => i === month);
    }
    return registrationChart;
  }, [registrationChart, range]);

  const statusChart = useMemo(
    () => [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive },
    ],
    [active, inactive],
  );

  const newMemberTimeline = useMemo(() => {
    return [...recentMembers]
      .sort((a, b) => {
        const da = new Date(a.joined_date || a.created_at || 0).getTime();
        const db = new Date(b.joined_date || b.created_at || 0).getTime();
        return db - da;
      })
      .slice(0, 7)
      .map((m) => ({
        id: m.id,
        name: formatMemberName(m),
        when: formatJoinedLabel(m.joined_date || m.created_at),
      }));
  }, [recentMembers]);

  const pieData = useMemo(() => {
    if (pieFilter === 'status') {
      const rows = [
        { name: 'Active members', value: active },
        { name: 'Inactive members', value: inactive },
      ].filter((r) => r.value > 0);
      return rows.length ? rows : [{ name: 'No members', value: 1 }];
    }
    const share = (stats?.ministryShare || []).filter((m) => m.value > 0);
    if (share.length) return share;
    const emptyNamed = (stats?.ministryShare || []).slice(0, 8);
    if (emptyNamed.length) {
      return emptyNamed.map((m) => ({ name: m.name, value: 0 }));
    }
    return [];
  }, [pieFilter, active, inactive, stats?.ministryShare]);

  const pieHasRealData =
    pieFilter === 'status'
      ? active + inactive > 0
      : (stats?.ministryShare || []).some((m) => m.value > 0);

  return (
    <div className="analysis-dashboard">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} xl={6}>
          <IntroduceCard
            title="Total Members"
            tip="All registered church members"
            total={<Statistic value={members} prefix={<TeamOutlined />} />}
            footer={
              <span>
                New this month <Text strong>{membersMonth}</Text>
              </span>
            }
          >
            <div className="ad-intro-trends">
              <Trend up={wow.up} label="WoW" value={wow.label} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {membersWeek} this week
              </Text>
            </div>
          </IntroduceCard>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <IntroduceCard
            title="Active Members"
            tip="Members marked active in the directory"
            total={<Statistic value={active} />}
            footer={
              <span>
                Inactive <Text strong>{inactive}</Text>
              </span>
            }
          >
            <SparkArea data={spark} color={BRAND} />
          </IntroduceCard>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <IntroduceCard
            title="Ministers"
            tip="Registered ministers and leaders"
            total={<Statistic value={ministers} prefix={<UserOutlined />} />}
            footer={
              <span>
                Active <Text strong>{activeMinisters}</Text>
              </span>
            }
          >
            <SparkBars data={spark} />
          </IntroduceCard>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <IntroduceCard
            title="Ministries with leaders"
            tip="Share of ministries that have an assigned leader"
            total={<Statistic value={leaderPct} suffix="%" />}
            footer={
              <Text type="secondary" className="ad-progress-caption">
                {withLeader} of {ministries} ministries
              </Text>
            }
          >
            <Progress
              percent={leaderPct}
              showInfo={false}
              strokeColor={BRAND}
              railColor="var(--border-color)"
              size={['100%', 8]}
            />
          </IntroduceCard>
        </Col>
      </Row>

      <Card className="ad-main-card" variant="borderless">
        <Tabs
          className="ad-main-tabs"
          tabBarExtraContent={
            <Select
              size="small"
              value={range}
              onChange={setRange}
              className="ad-range-select"
              popupMatchSelectWidth={false}
              options={[
                { label: 'This Month', value: 'month' },
                { label: 'This Year', value: 'year' },
              ]}
            />
          }
          items={[
            {
              key: 'registrations',
              label: 'Registrations',
              children: (
                <div className="ad-main-body">
                  <div className="ad-main-chart">
                    <Text type="secondary" className="ad-chart-label">
                      New member registrations
                      {range === 'year' ? ' this year' : ' this month'}
                    </Text>
                    {filteredRegistrationChart.some((b) => b.value > 0) ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={filteredRegistrationChart}
                          margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                        >
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                          <RechartsTooltip />
                          <Bar
                            dataKey="value"
                            fill={BRAND_SOFT}
                            radius={[4, 4, 0, 0]}
                            name="Registrations"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No registrations in this period"
                        style={{ marginTop: 48 }}
                      />
                    )}
                  </div>
                  <div className="ad-ranking">
                    <Title level={5} className="ad-ranking-title">
                      New members registered
                    </Title>
                    <ul className="ad-ranking-list">
                      {newMemberTimeline.length > 0 ? (
                        newMemberTimeline.map((item, index) => (
                          <li key={item.id}>
                            <span className={index < 3 ? 'ad-rank ad-rank-top' : 'ad-rank'}>
                              {index + 1}
                            </span>
                            <span className="ad-ranking-name" title={item.name}>
                              {item.name}
                            </span>
                            <span className="ad-ranking-value ad-ranking-date">{item.when}</span>
                          </li>
                        ))
                      ) : (
                        <li className="ad-ranking-empty">
                          <Text type="secondary">No recent registrations yet</Text>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Member status',
              children: (
                <div className="ad-main-body">
                  <div className="ad-main-chart">
                    <Text type="secondary" className="ad-chart-label">
                      Active vs inactive members
                    </Text>
                    {active + inactive > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={statusChart} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} name="Members" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No member status data"
                        style={{ marginTop: 48 }}
                      />
                    )}
                  </div>
                  <div className="ad-ranking">
                    <Title level={5} className="ad-ranking-title">
                      Latest registrations
                    </Title>
                    <ul className="ad-ranking-list">
                      {newMemberTimeline.length > 0 ? (
                        newMemberTimeline.map((item, index) => (
                          <li key={`status-${item.id}`}>
                            <span className={index < 3 ? 'ad-rank ad-rank-top' : 'ad-rank'}>
                              {index + 1}
                            </span>
                            <span className="ad-ranking-name" title={item.name}>
                              {item.name}
                            </span>
                            <span className="ad-ranking-value ad-ranking-date">{item.when}</span>
                          </li>
                        ))
                      ) : (
                        <li className="ad-ranking-empty">
                          <Text type="secondary">No recent registrations yet</Text>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={[24, 24]} className="ad-plans-row" align="stretch">
        <Col xs={24} className="ad-bottom-col">
          <Card
            className="ad-bottom-card ad-plans-card"
            variant="borderless"
            styles={{ body: { padding: 0 } }}
          >
            <UpcomingPrograms />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="ad-bottom-row" align="stretch">
        <Col xs={24} xl={12} className="ad-bottom-col">
          <Card
            className="ad-bottom-card ad-todo-card"
            variant="borderless"
            styles={{ body: { padding: 0 } }}
          >
            <TodoList />
          </Card>
        </Col>

        <Col xs={24} xl={12} className="ad-bottom-col">
          <Card
            className="ad-bottom-card"
            variant="borderless"
            title="Ministry share"
            extra={
              <Radio.Group
                size="small"
                value={pieFilter}
                onChange={(e) => setPieFilter(e.target.value)}
                options={[
                  { label: 'By ministry', value: 'all' },
                  { label: 'By status', value: 'status' },
                ]}
              />
            }
          >
            <div className="ad-pie-wrap">
              {pieHasRealData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      label={(props: { name?: string | number; value?: string | number }) => {
                        const name = String(props.name ?? '');
                        const value = Number(props.value ?? 0);
                        return `${name} ${value}`;
                      }}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    pieFilter === 'all'
                      ? 'No ministry memberships yet'
                      : 'No member status data'
                  }
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
