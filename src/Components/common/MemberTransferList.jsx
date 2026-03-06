import React from 'react';
import { Transfer } from 'antd';

/**
 * MemberTransferList — Reusable dual-list transfer for selecting members.
 *
 * Props:
 *  - members: array                              Full list of member objects (must have id, first_name, last_name, etc.)
 *  - selectedKeys: array                         Currently selected member IDs (target keys)
 *  - onChange: (targetKeys) => void              Called when selection changes
 *  - titles: [string, string]                    Panel titles (default: ['Available Members', 'Selected Members'])
 *  - listHeight: number                          Height of each panel (default: 320)
 *  - description: string                         Optional help text above the transfer
 */
const MemberTransferList = ({
    members = [],
    selectedKeys = [],
    onChange,
    titles = ['Available Members', 'Selected Members'],
    listHeight = 320,
    description,
}) => {
    const dataSource = members.map(m => ({
        key: m.id,
        title: `${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`,
        description: m.email || m.phone || '',
    }));

    return (
        <>
            {description && (
                <p style={{ color: '#64748b', marginBottom: '16px' }}>
                    {description}
                </p>
            )}
            <Transfer
                dataSource={dataSource}
                targetKeys={selectedKeys}
                onChange={onChange}
                render={item => item.title}
                showSearch
                filterOption={(inputValue, option) =>
                    option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.description.toLowerCase().includes(inputValue.toLowerCase())
                }
                listStyle={{ width: '100%', height: listHeight }}
                titles={titles}
                style={{ width: '100%' }}
            />
            <div style={{ marginTop: '12px', color: '#64748b', fontSize: '12px' }}>
                {selectedKeys.length} member(s) selected
            </div>
        </>
    );
};

export default MemberTransferList;
