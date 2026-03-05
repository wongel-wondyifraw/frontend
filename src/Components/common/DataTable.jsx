import React from 'react';
import { Table, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/**
 * DataTable — Reusable table component with a search bar and optional action button.
 *
 * Props:
 *  - columns: array                              Ant Design column definitions
 *  - dataSource: array                           Table data
 *  - loading: boolean                            Loading state
 *  - rowKey: string                              Row key field (default 'id')
 *  - searchPlaceholder: string                   Placeholder for the search input
 *  - searchValue: string                         Current search text
 *  - onSearchChange: (value) => void             Search input change handler
 *  - pageSize: number                            Pagination page size (default 10)
 *  - actionButton: { label, icon, onClick }      Optional primary action button config
 *  - extraFilters: ReactNode                     Optional extra filter elements
 *  - scroll: object                              Optional scroll config
 *  - tableCardClassName: string                  Optional class for the table card wrapper
 *  - title: string                               Optional header title
 */
const DataTable = ({
    columns,
    dataSource,
    loading = false,
    rowKey = 'id',
    searchPlaceholder = 'Search...',
    searchValue = '',
    onSearchChange,
    pageSize = 10,
    actionButton,
    extraFilters,
    scroll,
    tableCardClassName,
    title,
}) => {
    return (
        <>
            {/* Header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                {title && <h2 style={{ margin: 0 }}>{title}</h2>}
                {!title && <div />}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input
                        placeholder={searchPlaceholder}
                        prefix={<SearchOutlined />}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{ width: 250 }}
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

            {/* Table */}
            <div className={tableCardClassName}>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    rowKey={rowKey}
                    loading={loading}
                    pagination={{ pageSize }}
                    scroll={scroll}
                />
            </div>
        </>
    );
};

export default DataTable;
