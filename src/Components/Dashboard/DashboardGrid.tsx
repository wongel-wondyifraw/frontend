'use client';
import React from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useDashboard } from '../../context/DashboardContext';
import WidgetRenderer from './WidgetRenderer';
import './DashboardGrid.css';

const DashboardGrid = () => {
  const { widgets, isEditMode, layouts, onLayoutChange } = useDashboard();
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });

  return (
    <div className="dashboard-dynamic-grid" ref={containerRef}>
      {mounted && (
        <Responsive
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 24, md: 24, sm: 12, xs: 4, xxs: 2 }}
          rowHeight={30}
          width={width}
          margin={[20, 20] as const}
          dragConfig={{
            enabled: isEditMode,
            handle: '.widget-drag-handle',
          }}
          resizeConfig={{
            enabled: isEditMode,
          }}
          onLayoutChange={(currentLayout, allLayouts) => {
            const normalizedLayouts = Object.fromEntries(
              Object.entries(allLayouts).map(([key, value]) => [key, [...value]]),
            );
            onLayoutChange([...currentLayout], normalizedLayouts);
          }}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="grid-item-wrapper">
              <WidgetRenderer {...widget} />
            </div>
          ))}
        </Responsive>
      )}
    </div>
  );
};

export default DashboardGrid;
