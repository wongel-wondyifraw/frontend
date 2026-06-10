'use client';
import React, { type ReactNode } from 'react';
import { Table, Input, Button } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';

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
  extraFilters?: ReactNode;
  scroll?: { x?: number | string | true; y?: number | string };
  tableCardClassName?: string;
  title?: string;
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
  scroll,
  tableCardClassName,
  title,
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        {title ? <h2 style={{ margin: 0 }}>{title}</h2> : <div />}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          {extraFilters}
          {actionButton && (
            <Button
              type="primary"
              icon={actionButton.icon}
              onClick={actionButton.onClick}
              style={{ background: '#1565c0' }}
            >
              {actionButton.label}
            </Button>
          )}
        </div>
      </div>

      <div className={tableCardClassName}>
        <Table<T>
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          loading={loading}
          pagination={pagination}
          scroll={scroll}
        />
      </div>
    </>
  );
};

export default DataTable;
