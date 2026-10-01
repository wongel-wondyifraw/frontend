'use client';

import React, { useState } from 'react';
import { Button, Dropdown, Modal, Upload, Alert, Space, Typography } from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  ExportOutlined,
  ImportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { message } from '@/lib/app-message';
import { getApiErrorMessage } from '@/lib/errors';
import './DataImportExport.css';

const { Text } = Typography;

export type ImportResult = {
  ok: number;
  failed: number;
  errors: string[];
};

type DataImportExportProps = {
  entityLabel: string;
  canImport?: boolean;
  canExport?: boolean;
  onDownloadTemplate: () => void;
  onExportExcel: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  onImportFile: (file: File) => Promise<ImportResult>;
  onImportComplete?: () => void;
};

export default function DataImportExport({
  entityLabel,
  canImport = true,
  canExport = true,
  onDownloadTemplate,
  onExportExcel,
  onExportPdf,
  onImportFile,
  onImportComplete,
}: DataImportExportProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true);
      if (format === 'excel') {
        await onExportExcel();
        message.success(`${entityLabel} exported as Excel`);
      } else {
        await onExportPdf();
        message.success(`${entityLabel} exported as PDF`);
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to export ${entityLabel.toLowerCase()}`));
    } finally {
      setExporting(false);
    }
  };

  const openImport = () => {
    setResult(null);
    setFileList([]);
    setImportOpen(true);
  };

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) {
      message.warning('Choose a CSV or Excel file to import');
      return;
    }
    try {
      setImporting(true);
      const res = await onImportFile(file);
      setResult(res);
      if (res.ok > 0) {
        message.success(`Imported ${res.ok} ${entityLabel.toLowerCase()}`);
        onImportComplete?.();
      }
      if (res.failed > 0 && res.ok === 0) {
        message.error(`Import failed for all ${res.failed} rows`);
      } else if (res.failed > 0) {
        message.warning(`${res.failed} row(s) failed — see details below`);
      }
      if (res.ok > 0 && res.failed === 0) {
        setImportOpen(false);
        setFileList([]);
        setResult(null);
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to import ${entityLabel.toLowerCase()}`));
    } finally {
      setImporting(false);
    }
  };

  if (!canImport && !canExport) return null;

  return (
    <>
      <div className="data-io-actions">
        <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
          Template
        </Button>
        {canImport ? (
          <Button icon={<ImportOutlined />} onClick={openImport}>
            Import
          </Button>
        ) : null}
        {canExport ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'excel',
                  icon: <FileExcelOutlined />,
                  label: 'Excel (.xlsx)',
                  onClick: () => void handleExport('excel'),
                },
                {
                  key: 'pdf',
                  icon: <FilePdfOutlined />,
                  label: 'PDF',
                  onClick: () => void handleExport('pdf'),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button icon={<ExportOutlined />} loading={exporting}>
              Export <DownOutlined />
            </Button>
          </Dropdown>
        ) : null}
      </div>

      <Modal
        title={`Import ${entityLabel}`}
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={handleImport}
        okText="Import"
        confirmLoading={importing}
        okButtonProps={{ disabled: fileList.length === 0 }}
        destroyOnHidden
        width={480}
      >
        <div className="data-io-modal">
          <div className="data-io-template-row">
            <Button icon={<FileExcelOutlined />} onClick={onDownloadTemplate}>
              Download template
            </Button>
            <Text type="secondary">Excel (.xlsx) with required columns</Text>
          </div>

          <Upload.Dragger
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: next }) => setFileList(next.slice(-1))}
            onRemove={() => {
              setFileList([]);
              setResult(null);
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag CSV / Excel here</p>
            <p className="ant-upload-hint">Use the template columns for a successful import</p>
          </Upload.Dragger>

          {result ? (
            <Alert
              type={result.failed ? 'warning' : 'success'}
              showIcon
              message={`${result.ok} imported, ${result.failed} failed`}
              description={
                result.errors.length ? (
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    {result.errors.slice(0, 8).map((e) => (
                      <Text key={e} type="danger" style={{ fontSize: 12 }}>
                        {e}
                      </Text>
                    ))}
                    {result.errors.length > 8 ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        …and {result.errors.length - 8} more
                      </Text>
                    ) : null}
                  </Space>
                ) : undefined
              }
            />
          ) : null}
        </div>
      </Modal>
    </>
  );
}
