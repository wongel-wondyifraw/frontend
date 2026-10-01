'use client';

import React from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import './TableRowActions.css';

export type TableRowActionItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type TableRowActionsProps = {
  items: TableRowActionItem[];
  /** Accessible label for the trigger */
  ariaLabel?: string;
};

/**
 * System-wide row overflow menu (⋯) for manage tables.
 * Keeps action columns narrow on mobile.
 */
export const TABLE_ACTIONS_COLUMN = {
  width: 80,
  align: 'right' as const,
  className: 'table-col-actions',
  onHeaderCell: () => ({ className: 'table-col-actions' }),
};

export default function TableRowActions({
  items,
  ariaLabel = 'Row actions',
}: TableRowActionsProps) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  const menuItems: MenuProps['items'] = visible.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    danger: item.danger,
    disabled: item.disabled,
    onClick: ({ domEvent }) => {
      domEvent.stopPropagation();
      item.onClick?.();
    },
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        type="text"
        size="small"
        className="table-row-actions-trigger"
        icon={<MoreOutlined />}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
}
