'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Spin, Tag } from 'antd';
import { getPlans } from '@/services/api';
import type { Plan, PlanType } from '@/types';
import './UpcomingPrograms.css';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const TYPE_META: Record<PlanType, { label: string; color: string }> = {
  program: { label: 'Program', color: 'blue' },
  crusade: { label: 'Crusade', color: 'magenta' },
  general_assembly: { label: 'Assembly', color: 'purple' },
  training: { label: 'Training', color: 'cyan' },
  fasting_day: { label: 'Fasting', color: 'orange' },
  gospel_campaign: { label: 'Campaign', color: 'green' },
};

function formatPlanSlot(plan: Plan) {
  const date = new Date(String(plan.plan_date).slice(0, 10) + 'T12:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()] || '';
  const start = plan.start_time ? String(plan.start_time).slice(0, 5) : '';
  const end = plan.end_time ? String(plan.end_time).slice(0, 5) : '';
  const time = start && end ? `${start} – ${end}` : start || end || 'All day';
  return { day, month, time };
}

const UpcomingPrograms = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await getPlans({
          page: 1,
          limit: 8,
          from: today,
          status: 'planned',
        });
        if (!cancelled) {
          const sorted = [...(res.data || [])].sort((a, b) =>
            String(a.plan_date).localeCompare(String(b.plan_date)),
          );
          setPlans(sorted);
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="upcoming-programs-card">
      <div className="upcoming-programs-head">
        <h3>Upcoming plans</h3>
        <Link href="/planning" className="upcoming-programs-link">
          View calendar
        </Link>
      </div>
      {loading ? (
        <div className="programs-loading">
          <Spin size="small" />
        </div>
      ) : plans.length === 0 ? (
        <p className="programs-empty">No upcoming plans scheduled.</p>
      ) : (
        <div className="programs-list">
          {plans.map((plan) => {
            const { day, month, time } = formatPlanSlot(plan);
            const type = TYPE_META[plan.type] || { label: plan.type, color: 'blue' };
            return (
              <Link
                key={plan.id}
                href={`/planning/details/${plan.id}`}
                className="program-item program-item--link"
              >
                <div className="program-date-box">
                  <span className="program-day">{day}</span>
                  <span className="program-month">{month}</span>
                </div>
                <div className="program-info">
                  <div className="program-title-row">
                    <span className="program-title">{plan.title}</span>
                    <Tag color={type.color} className="program-type-tag">
                      {type.label}
                    </Tag>
                  </div>
                  <div className="program-time">
                    <ClockCircleOutlined style={{ fontSize: 14 }} />
                    {time}
                    {plan.location ? (
                      <>
                        <EnvironmentOutlined style={{ fontSize: 14, marginLeft: 8 }} />
                        <span className="program-location">{plan.location}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingPrograms;
