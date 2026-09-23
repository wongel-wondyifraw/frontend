'use client';
import React, { type ReactNode } from 'react';
import { Table, Input, Button } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import './DataTable.css';

interface ActionButtonConfig {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface ServerPaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface DataTableProps<T extends object> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  rowKey?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  pageSize?: number;
  serverPagination?: ServerPaginationConfig;
  actionButton?: ActionButtonConfig;
  /** Inline filters (left of search row). Prefer filterPanel when many. */
  extraFilters?: ReactNode;
  /** Compact filter control (e.g. DataTableFilterPopup) — left-aligned after search */
  filterPanel?: ReactNode;
  /** Hide the built-in search input (when search lives outside DataTable) */
  hideSearch?: boolean;
  /** Placed beside the primary action on the right side of the controls row */
  actionAdjacent?: ReactNode;
  tableCardClassName?: string;
  title?: string;
  /** Avoid Ant Design treating a data field named `children` as tree rows */
  childrenColumnName?: string;
}

const DataTable = <T extends object>({
  columns,
  dataSource,
  loading = false,
  rowKey = 'id',
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  pageSize = 10,
  serverPagination,
  actionButton,
  extraFilters,
  filterPanel,
  hideSearch = false,
  actionAdjacent,
  tableCardClassName,
  title,
  childrenColumnName,
}: DataTableProps<T>) => {
  const pagination: TablePaginationConfig | false = serverPagination
    ? {
        current: serverPagination.current,
        pageSize: serverPagination.pageSize,
        total: serverPagination.total,
        showSizeChanger: true,
        onChange: serverPagination.onChange,
      }
    : { pageSize };

  const hasActions = Boolean(actionAdjacent || actionButton);
  const hasFilters = Boolean(filterPanel || extraFilters);
  const showControls = !hideSearch || hasFilters || hasActions;
  const showToolbar = Boolean(title || showControls);

  return (
    <>
      {showToolbar ? (
        <div className="data-table-toolbar">
          {title ? <h2 className="data-table-title">{title}</h2> : null}

          {showControls ? (
            <div className="data-table-controls">
              {hasFilters ? (
                <div className="data-table-filters">
                  {filterPanel}
                  {extraFilters}
                </div>
              ) : null}
              {!hideSearch ? (
                <Input
                  className="data-table-search"
                  placeholder={searchPlaceholder}
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  allowClear
                />
              ) : null}
              {hasActions ? (
                <div className="data-table-end page-header-actions">
                  {actionAdjacent}
                  {actionButton ? (
                    <Button
                      className="data-table-action"
                      type="primary"
                      icon={actionButton.icon}
                      onClick={actionButton.onClick}
                    >
                      {actionButton.label}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={tableCardClassName || 'data-table-card'}>
        <Table<T>
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          childrenColumnName={childrenColumnName}
        />
      </div>
    </>
  );
};

export default DataTable;
