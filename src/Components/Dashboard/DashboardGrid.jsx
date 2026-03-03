import React, { useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboard } from '../../context/DashboardContext';
import WidgetRenderer from './WidgetRenderer';
import './DashboardGrid.css';

const DashboardGrid = () => {
    const { widgets, isEditMode, layouts, onLayoutChange } = useDashboard();
    const containerRef = useRef(null);
    const [width, setWidth] = useState(1200);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="dashboard-dynamic-grid" ref={containerRef}>
            <Responsive
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 24, md: 24, sm: 12, xs: 4, xxs: 2 }}
                rowHeight={30}
                width={width}
                onLayoutChange={onLayoutChange}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                draggableHandle=".widget-drag-handle"
                margin={[20, 20]}
            >
                {widgets.map(widget => (
                    <div key={widget.id} className="grid-item-wrapper">
                        <WidgetRenderer {...widget} />
                    </div>
                ))}
            </Responsive>
        </div>
    );
};

export default DashboardGrid;
