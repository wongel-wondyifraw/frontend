'use client';
import React, { type ReactNode } from 'react';
import { Table, Input, Button, Skeleton } from 'antd';
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
  /** Inline filters beside header actions (e.g. status Select) */
  extraFilters?: ReactNode;
  /** Compact filter control (e.g. DataTableFilterPopup) — trailing edge with search */
  filterPanel?: ReactNode;
  /** Trailing controls beside filters (import/export, etc.) */
  controlsEnd?: ReactNode;
  /** Hide the built-in search input (when search lives outside DataTable) */
  hideSearch?: boolean;
  /** Placed beside the primary action in the header action cluster */
  actionAdjacent?: ReactNode;
  tableCardClassName?: string;
  title?: string;
  /** Short definition under the title (Planning-style section header) */
  subtitle?: string;
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
  controlsEnd,
  hideSearch = false,
  actionAdjacent,
  tableCardClassName,
  title,
  subtitle,
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

  const hasHeaderActions = Boolean(extraFilters || actionAdjacent || actionButton);
  const hasControlFilters = Boolean(filterPanel || controlsEnd);
  const showSearchRow = !hideSearch || hasControlFilters;
  const showToolbar = Boolean(title || subtitle || hasHeaderActions || showSearchRow);

  return (
    <>
      {showToolbar ? (
        <div className="data-table-toolbar">
          {(title || subtitle || hasHeaderActions) ? (
            <div className="data-table-header-row page-section-header">
              {title || subtitle ? (
                <div className="data-table-header-text page-section-header-text">
                  {title ? <h2 className="data-table-title">{title}</h2> : null}
                  {subtitle ? <p className="data-table-subtitle">{subtitle}</p> : null}
                </div>
              ) : (
                <span />
              )}
              {hasHeaderActions ? (
                <div className="data-table-end page-header-actions">
                  {extraFilters}
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

          {showSearchRow ? (
            <div className="data-table-controls">
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
              {hasControlFilters ? (
                <div className="data-table-filters">
                  {controlsEnd}
                  {filterPanel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={tableCardClassName || 'data-table-card'}>
        {loading && (!dataSource || dataSource.length === 0) ? (
          <div style={{ padding: '24px' }}>
            <Skeleton active title={false} paragraph={{ rows: pageSize || 10, width: ['100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '100%', '80%'] }} />
          </div>
        ) : (
          <Table<T>
            dataSource={dataSource}
            columns={columns}
            rowKey={rowKey}
            loading={loading}
            pagination={pagination}
            childrenColumnName={childrenColumnName}
          />
        )}
      </div>
    </>
  );
};

export default DataTable;
