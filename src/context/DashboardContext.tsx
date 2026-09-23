'use client';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DashboardContextValue, DashboardLayoutItem, DashboardWidget } from '@/types';

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export const useDashboard = (): DashboardContextValue => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

const PROGRAMS_WIDGET: DashboardWidget = { id: 'w-programs', type: 'programs', settings: {} };
const PROGRAMS_LAYOUT: DashboardLayoutItem = { i: 'w-programs', x: 0, y: 3, w: 8, h: 8, minW: 6, minH: 6 };

const TODO_WIDGET: DashboardWidget = { id: 'w-todo', type: 'todo', settings: { title: 'To-Do' } };
const TODO_LAYOUT: DashboardLayoutItem = { i: 'w-todo', x: 8, y: 3, w: 8, h: 8, minW: 6, minH: 6 };

/** Default view pulls from the widget store — not only the old KPI + calendar set */
const INITIAL_WIDGETS: DashboardWidget[] = [
  { id: 'w-members', type: 'memberOverview', settings: { title: 'Total Members', totalLabel: 'Total Members', icon: 'group', metric: 'members' } },
  { id: 'w-ministers', type: 'ministers', settings: { title: 'Total Ministers', totalLabel: 'Total Ministers', icon: 'church', metric: 'ministers' } },
  { id: 'w-ministries', type: 'ministries', settings: { title: 'Total Ministries', totalLabel: 'Active Ministries', icon: 'volunteer', metric: 'ministries' } },
  { id: 'w-attendance', type: 'attendance', settings: {} },
  { id: 'w-time', type: 'time', settings: {} },
  { id: 'w-programs', type: 'programs', settings: {} },
  TODO_WIDGET,
  { id: 'w-calendar', type: 'calendar', settings: {} },
  { id: 'w-announcements', type: 'announcements', settings: {} },
  { id: 'w-actions', type: 'quickActions', settings: {} },
  { id: 'w-data', type: 'dataAccess', settings: {} },
];

/**
 * 24-col default composed from the widget store:
 * KPIs + attendance + time → programs / todo / calendar → announcements / actions / data access
 */
const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
  { i: 'w-members', x: 0, y: 0, w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
  { i: 'w-ministers', x: 4, y: 0, w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
  { i: 'w-ministries', x: 8, y: 0, w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
  { i: 'w-attendance', x: 12, y: 0, w: 8, h: 3, minW: 5, minH: 3, maxH: 6 },
  { i: 'w-time', x: 20, y: 0, w: 4, h: 3, minW: 3, minH: 3, maxH: 5 },
  { i: 'w-programs', x: 0, y: 3, w: 8, h: 8, minW: 6, minH: 6 },
  TODO_LAYOUT,
  { i: 'w-calendar', x: 16, y: 3, w: 8, h: 8, minW: 6, minH: 6 },
  { i: 'w-announcements', x: 0, y: 11, w: 10, h: 8, minW: 6, minH: 5 },
  { i: 'w-actions', x: 10, y: 11, w: 7, h: 8, minW: 4, minH: 5 },
  { i: 'w-data', x: 17, y: 11, w: 7, h: 8, minW: 4, minH: 5 },
];

const STORAGE_KEY = 'cms_dashboard_config_v5';

function ensureMandatoryWidgets(
  widgets: DashboardWidget[],
  layouts: Record<string, DashboardLayoutItem[]>,
): { widgets: DashboardWidget[]; layouts: Record<string, DashboardLayoutItem[]> } {
  let nextWidgets = [...widgets];
  const nextLayouts = { ...layouts };
  const lg = [...(nextLayouts.lg || [])];

  if (!nextWidgets.some((w) => w.type === 'programs')) {
    nextWidgets = [...nextWidgets, PROGRAMS_WIDGET];
    if (!lg.some((l) => l.i === PROGRAMS_WIDGET.id)) {
      lg.push(PROGRAMS_LAYOUT);
    }
  }

  if (!nextWidgets.some((w) => w.type === 'todo')) {
    nextWidgets = [...nextWidgets, TODO_WIDGET];
    if (!lg.some((l) => l.i === TODO_WIDGET.id)) {
      lg.push(TODO_LAYOUT);
    }
  }

  nextLayouts.lg = lg;
  return { widgets: nextWidgets, layouts: nextLayouts };
}

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider = ({ children }: DashboardProviderProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const widgetsRef = useRef<DashboardWidget[]>(INITIAL_WIDGETS);

  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    if (typeof window === 'undefined') return INITIAL_WIDGETS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          widgets?: DashboardWidget[];
          layouts?: Record<string, DashboardLayoutItem[]>;
        };
        const ensured = ensureMandatoryWidgets(
          parsed.widgets || INITIAL_WIDGETS,
          parsed.layouts || { lg: DEFAULT_LAYOUT },
        );
        return ensured.widgets;
      } catch (e) {
        console.error('Failed to parse saved dashboard', e);
        return INITIAL_WIDGETS;
      }
    }
    return INITIAL_WIDGETS;
  });

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  const [layouts, setLayouts] = useState<Record<string, DashboardLayoutItem[]>>(() => {
    if (typeof window === 'undefined') return { lg: DEFAULT_LAYOUT };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          widgets?: DashboardWidget[];
          layouts?: Record<string, DashboardLayoutItem[]>;
        };
        const ensured = ensureMandatoryWidgets(
          parsed.widgets || INITIAL_WIDGETS,
          parsed.layouts || { lg: DEFAULT_LAYOUT },
        );
        return ensured.layouts;
      } catch {
        return { lg: DEFAULT_LAYOUT };
      }
    }
    return { lg: DEFAULT_LAYOUT };
  });

  const toggleEditMode = () => setIsEditMode((prev) => !prev);

  const saveToLocalStorage = (currentWidgets: DashboardWidget[], currentLayouts: Record<string, DashboardLayoutItem[]>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      widgets: currentWidgets,
      layouts: currentLayouts,
    }));
  };

  const scheduleSave = (currentWidgets: DashboardWidget[], currentLayouts: Record<string, DashboardLayoutItem[]>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(currentWidgets, currentLayouts);
    }, 400);
  };

  const layoutsRef = useRef(layouts);

  useEffect(() => {
    layoutsRef.current = layouts;
  }, [layouts]);

  const onLayoutChange = (_currentLayout: DashboardLayoutItem[], allLayouts: Record<string, DashboardLayoutItem[]>) => {
    if (JSON.stringify(layoutsRef.current) === JSON.stringify(allLayouts)) {
      return;
    }
    layoutsRef.current = allLayouts;
    setLayouts(allLayouts);
    scheduleSave(widgetsRef.current, allLayouts);
  };

  const addWidget = (type: string, settings: Record<string, unknown> = {}) => {
    const id = `w-${Date.now()}`;
    const newWidget: DashboardWidget = { id, type, settings };
    const newWidgets = [...widgets, newWidget];

    const defaultSizes: Record<string, Partial<DashboardLayoutItem>> = {
      memberOverview: { w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
      ministers: { w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
      ministries: { w: 4, h: 3, minW: 3, maxW: 8, minH: 3, maxH: 5 },
      attendance: { w: 8, h: 3, minW: 5, minH: 3 },
      announcements: { w: 10, h: 8, minW: 6, minH: 5 },
      dataAccess: { w: 7, h: 8, minW: 4, minH: 5 },
      time: { w: 4, h: 3, minW: 3, minH: 3 },
      calendar: { w: 8, h: 8, minW: 6, minH: 6 },
      todo: { w: 8, h: 8, minW: 6, minH: 6 },
      programs: { w: 8, h: 8, minW: 6, minH: 6 },
      quickActions: { w: 7, h: 8, minW: 4, minH: 5 },
      stats: { w: 4, h: 3 },
    };

    const size = defaultSizes[type] || { w: 3, h: 4 };

    const newLayouts = {
      ...layouts,
      lg: [...(layouts.lg || []), { i: id, x: 0, y: Infinity, w: size.w ?? 3, h: size.h ?? 4 }],
    };

    setWidgets(newWidgets);
    widgetsRef.current = newWidgets;
    setLayouts(newLayouts);
    saveToLocalStorage(newWidgets, newLayouts);
  };

  const removeWidget = (widgetId: string) => {
    const target = widgets.find((w) => w.id === widgetId);
    if (target?.type === 'todo') {
      const todoCount = widgets.filter((w) => w.type === 'todo').length;
      if (todoCount <= 1) return;
    }

    const newWidgets = widgets.filter((w) => w.id !== widgetId);
    const newLayouts = { ...layouts };
    for (const key in newLayouts) {
      newLayouts[key] = newLayouts[key].filter((l) => l.i !== widgetId);
    }

    setWidgets(newWidgets);
    widgetsRef.current = newWidgets;
    setLayouts(newLayouts);
    saveToLocalStorage(newWidgets, newLayouts);
  };

  const saveLayout = () => {
    saveToLocalStorage(widgets, layouts);
    setIsEditMode(false);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
  };

  const resetLayout = () => {
    setWidgets(INITIAL_WIDGETS);
    setLayouts({ lg: DEFAULT_LAYOUT });
    saveToLocalStorage(INITIAL_WIDGETS, { lg: DEFAULT_LAYOUT });
  };

  return (
    <DashboardContext.Provider value={{
      isEditMode,
      widgets,
      layouts,
      onLayoutChange,
      toggleEditMode,
      addWidget,
      removeWidget,
      saveLayout,
      cancelEdit,
      resetLayout,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
