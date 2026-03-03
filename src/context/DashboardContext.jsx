import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => React.useContext(DashboardContext);

// Initial default widgets
const INITIAL_WIDGETS = [
    { id: 'w1', type: 'memberOverview', settings: { title: 'Total Members', count: '1000', totalLabel: 'Total Members', trend: '+12 this month', icon: 'group', data: [{ name: 'Active', value: 850 }, { name: 'Inactive', value: 150 }], legend: ['Active', 'Inactive'] } },
    { id: 'w2', type: 'ministers', settings: { title: 'Total Ministers', count: '20', totalLabel: 'Total Ministers', trend: '+2 this month', icon: 'church', data: [{ name: 'Licensed', value: 15 }, { name: 'Ordained', value: 5 }], legend: ['Licensed', 'Ordained'] } },
    { id: 'w3', type: 'ministries', settings: { title: 'Total Ministries', count: '6', totalLabel: 'Active Ministries', trend: 'Stable', icon: 'volunteer', data: [{ name: 'Active', value: 5 }, { name: 'Hiatus', value: 1 }], legend: ['Active', 'Hiatus'] } },
    { id: 'w7', type: 'calendar', settings: {} },
    { id: 'w10', type: 'announcements', settings: {} },
];

const DEFAULT_LAYOUT = [
    // Top Row: 3 Overview Widgets (7 cols each in 24-col grid = 21 cols total, 3 cols spacing)
    { i: 'w1', x: 0, y: 0, w: 7, h: 4 },
    { i: 'w2', x: 7, y: 0, w: 7, h: 4 },
    { i: 'w3', x: 14, y: 0, w: 7, h: 4 },

    // Bottom Row: Calendar and Announcements
    { i: 'w10', x: 0, y: 4, w: 14, h: 9 }, // Announcements (Left, spans 2 KPIs)
    { i: 'w7', x: 14, y: 4, w: 7, h: 9 },  // Calendar (Right, aligned with 3rd KPI)
];

const STORAGE_KEY = 'cms_dashboard_config_v1';

export const DashboardProvider = ({ children }) => {
    // ... (state init code same)
    const [isEditMode, setIsEditMode] = useState(false);

    const [widgets, setWidgets] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.widgets || INITIAL_WIDGETS;
            } catch (e) {
                console.error("Failed to parse saved dashboard", e);
                return INITIAL_WIDGETS;
            }
        }
        return INITIAL_WIDGETS;
    });

    const [layouts, setLayouts] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.layouts || { lg: DEFAULT_LAYOUT };
            } catch (e) {
                return { lg: DEFAULT_LAYOUT };
            }
        }
        return { lg: DEFAULT_LAYOUT };
    });

    // ... (toggle code same)
    const toggleEditMode = () => setIsEditMode(prev => !prev);

    // ... (onLayoutChange, saveToLocalStorage same)
    const onLayoutChange = (currentLayout, allLayouts) => {
        setLayouts(allLayouts);
        saveToLocalStorage(widgets, allLayouts);
    };

    const saveToLocalStorage = (currentWidgets, currentLayouts) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            widgets: currentWidgets,
            layouts: currentLayouts
        }));
    };

    const addWidget = (type, settings = {}) => {
        const id = `w-${Date.now()}`;
        const newWidget = { id, type, settings };
        const newWidgets = [...widgets, newWidget];

        // Default Sizes Mapping (Updated for 24-col Grid)
        const defaultSizes = {
            memberOverview: { w: 7, h: 4 },
            ministers: { w: 7, h: 4 },
            ministries: { w: 7, h: 4 },
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

        // Add to layout
        const newLayouts = {
            ...layouts,
            lg: [...(layouts.lg || []), { i: id, x: 0, y: Infinity, w: size.w, h: size.h }]
        };

        setWidgets(newWidgets);
        setLayouts(newLayouts);
        saveToLocalStorage(newWidgets, newLayouts);
    };

    const removeWidget = (id) => {
        const newWidgets = widgets.filter(w => w.id !== id);
        const newLayouts = { ...layouts };
        for (const key in newLayouts) {
            newLayouts[key] = newLayouts[key].filter(l => l.i !== id);
        }

        setWidgets(newWidgets);
        setLayouts(newLayouts);
        saveToLocalStorage(newWidgets, newLayouts);
    };

    const saveLayout = () => {
        console.log("Explicitly Saving layout...");
        saveToLocalStorage(widgets, layouts);
        setIsEditMode(false);
    };

    const cancelEdit = () => {
        // To revert, we'd need a "history" or "original" state.
        // For now, simpler: just exit edit mode. The changes were already auto-saved to LS for persistence.
        setIsEditMode(false);
    };

    // Reset to defaults utility (if needed debugging)
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
            resetLayout
        }}>
            {children}
        </DashboardContext.Provider>
    );
};
