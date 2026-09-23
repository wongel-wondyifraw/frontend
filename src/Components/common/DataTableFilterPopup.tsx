'use client';

import React, { useState, type ReactNode } from 'react';
import { Badge, Button, Popover } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import './DataTableFilterPopup.css';

interface DataTableFilterPopupProps {
  children: ReactNode;
  /** Number of active filters (shows on badge) */
  activeCount?: number;
  onClear?: () => void;
  label?: string;
}

const DataTableFilterPopup = ({
  children,
  activeCount = 0,
  onClear,
  label = 'Filters',
}: DataTableFilterPopupProps) => {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="dt-filter-popup">
      <div className="dt-filter-popup-head">
        <span className="dt-filter-popup-title">{label}</span>
        {onClear && activeCount > 0 ? (
          <Button type="link" size="small" onClick={onClear} className="dt-filter-popup-clear">
            Clear all
          </Button>
        ) : null}
      </div>
      <div className="dt-filter-popup-body">{children}</div>
      <div className="dt-filter-popup-foot">
        <Button type="primary" block onClick={() => setOpen(false)}>
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      arrow={false}
      overlayClassName="dt-filter-popover"
    >
      <Badge count={activeCount} size="small" offset={[-4, 4]} className="dt-filter-badge">
        <Button
          className="dt-filter-trigger"
          icon={<FilterOutlined />}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {label}
          {activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </Badge>
    </Popover>
  );
};

export default DataTableFilterPopup;
