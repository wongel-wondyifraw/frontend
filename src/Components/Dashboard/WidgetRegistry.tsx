'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

interface WidgetProps {
  settings?: Record<string, unknown>;
}

const widgetLoading = () => (
  <div className="widget-skeleton" aria-hidden="true" />
);

function lazyWidget(loader: () => Promise<{ default: ComponentType<WidgetProps> }>) {
  return dynamic(loader as () => Promise<{ default: ComponentType<WidgetProps> }>, { ssr: false, loading: widgetLoading });
}

export const WidgetRegistry = {
  stats: lazyWidget(() => import('./Widgets/StatCard/StatCardWrapper')),
  programs: lazyWidget(() => import('./Widgets/UpcomingPrograms/UpcomingPrograms')),
  todo: lazyWidget(() => import('./Widgets/TodoList/TodoList')),
  quickActions: lazyWidget(() => import('./Widgets/QuickActions/QuickActions')),
  calendar: lazyWidget(() => import('./Widgets/CalendarWidget/CalendarWidget')),
  memberOverview: lazyWidget(() => import('./Widgets/OverviewWidget/OverviewWidget')),
  ministers: lazyWidget(() => import('./Widgets/OverviewWidget/OverviewWidget')),
  ministries: lazyWidget(() => import('./Widgets/OverviewWidget/OverviewWidget')),
  attendance: lazyWidget(() => import('./Widgets/AttendanceWidget/AttendanceWidget')),
  announcements: lazyWidget(() => import('./Widgets/AnnouncementsWidget/AnnouncementsWidget')),
  time: lazyWidget(() => import('./Widgets/TimeWidget/TimeWidget')),
  dataAccess: lazyWidget(() => import('./Widgets/DataAccessWidget/DataAccessWidget')),
} as const;

export type WidgetType = keyof typeof WidgetRegistry;
