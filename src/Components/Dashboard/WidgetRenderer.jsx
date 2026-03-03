import React from 'react';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { WidgetRegistry } from './WidgetRegistry.jsx';
import { useDashboard } from '../../context/DashboardContext';

const WidgetRenderer = ({ id, type, settings }) => {
    const { isEditMode, removeWidget } = useDashboard();
    const WidgetComponent = WidgetRegistry[type];

    if (!WidgetComponent) {
        return <div>Unknown Widget Type: {type}</div>;
    }

    return (
        <div className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''}`} style={{ position: 'relative' }}>
            {isEditMode && (
                <div className="widget-overlay">
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => removeWidget(id)}
                        style={{ position: 'absolute', top: -10, right: -10, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                    />
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
            <WidgetComponent settings={settings} />
        </div>
    );
};

export default WidgetRenderer;
