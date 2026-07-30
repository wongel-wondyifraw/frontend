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

const TODO_WIDGET: DashboardWidget = { id: 'w-todo', type: 'todo', settings: { title: 'To-Do' } };
const TODO_LAYOUT: DashboardLayoutItem = { i: 'w-todo', x: 0, y: 13, w: 8, h: 10, minW: 6, minH: 6 };

const INITIAL_WIDGETS: DashboardWidget[] = [
  { id: 'w1', type: 'memberOverview', settings: { title: 'Total Members', count: '1000', totalLabel: 'Total Members', trend: '+12 this month', icon: 'group', data: [{ name: 'Active', value: 850 }, { name: 'Inactive', value: 150 }], legend: ['Active', 'Inactive'] } },
  { id: 'w2', type: 'ministers', settings: { title: 'Total Ministers', count: '20', totalLabel: 'Total Ministers', trend: '+2 this month', icon: 'church', data: [{ name: 'Licensed', value: 15 }, { name: 'Ordained', value: 5 }], legend: ['Licensed', 'Ordained'] } },
  { id: 'w3', type: 'ministries', settings: { title: 'Total Ministries', count: '6', totalLabel: 'Active Ministries', trend: 'Stable', icon: 'volunteer', data: [{ name: 'Active', value: 5 }, { name: 'Hiatus', value: 1 }], legend: ['Active', 'Hiatus'] } },
  { id: 'w7', type: 'calendar', settings: {} },
  { id: 'w10', type: 'announcements', settings: {} },
  TODO_WIDGET,
];

const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
  { i: 'w1', x: 0, y: 0, w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
  { i: 'w2', x: 7, y: 0, w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
  { i: 'w3', x: 14, y: 0, w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
  { i: 'w10', x: 0, y: 4, w: 14, h: 9 },
  { i: 'w7', x: 14, y: 4, w: 7, h: 9 },
  TODO_LAYOUT,
];

const STORAGE_KEY = 'cms_dashboard_config_v2';

function ensureMandatoryWidgets(
  widgets: DashboardWidget[],
  layouts: Record<string, DashboardLayoutItem[]>,
): { widgets: DashboardWidget[]; layouts: Record<string, DashboardLayoutItem[]> } {
  let nextWidgets = [...widgets];
  const nextLayouts = { ...layouts };
  const lg = [...(nextLayouts.lg || [])];

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
      memberOverview: { w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
      ministers: { w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
      ministries: { w: 7, h: 4, minW: 5, maxW: 10, minH: 4, maxH: 5 },
      attendance: { w: 6, h: 8 },
      announcements: { w: 14, h: 9 },
      dataAccess: { w: 16, h: 8 },
      time: { w: 6, h: 4 },
      calendar: { w: 7, h: 9 },
      todo: { w: 8, h: 10 },
      programs: { w: 10, h: 10 },
      quickActions: { w: 6, h: 7 },
      stats: { w: 6, h: 4 },
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
