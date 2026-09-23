'use client';
import React, { Suspense } from 'react';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { WidgetRegistry } from './WidgetRegistry';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardWidget } from '@/types';

const WidgetRenderer = ({ id, type, settings = {} }: DashboardWidget) => {
    const { isEditMode, removeWidget, widgets } = useDashboard();
    const WidgetComponent = WidgetRegistry[type as keyof typeof WidgetRegistry];
    const todoCount = widgets.filter((w) => w.type === 'todo').length;
    const programsCount = widgets.filter((w) => w.type === 'programs').length;
    const canRemove =
      !(type === 'todo' && todoCount <= 1) &&
      !(type === 'programs' && programsCount <= 1);

    if (!WidgetComponent) {
        return <div>Unknown Widget Type: {type}</div>;
    }

    return (
        <div className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''}`} style={{ position: 'relative' }}>
            {isEditMode && (
                <div className="widget-overlay">
                    {canRemove && (
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<DeleteOutlined />}
                            onClick={() => removeWidget(id)}
                            style={{ position: 'absolute', top: -10, right: -10, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                        />
                    )}
                    <div className="widget-drag-handle" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        border: '2px dashed #1565c0',
                        borderRadius: '12px',
                        pointerEvents: 'none',
                        backgroundColor: 'rgba(21, 101, 192, 0.05)'
                    }} />
                </div>
            )}
            <Suspense fallback={<div className="widget-skeleton" aria-hidden="true" />}>
                <WidgetComponent settings={settings} />
            </Suspense>
        </div>
    );
};

export default WidgetRenderer;
