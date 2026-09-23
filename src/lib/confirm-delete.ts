'use client';

import { Modal } from 'antd';

type ConfirmDeleteOptions = {
  title?: string;
  content?: string;
  okText?: string;
  onOk: () => void | Promise<void>;
};

/** Shared destructive-action confirmation used across the CMS. */
export function confirmDelete({
  title = 'Delete this item?',
  content = 'This action cannot be undone.',
  okText = 'Delete',
  onOk,
}: ConfirmDeleteOptions): void {
  Modal.confirm({
    title,
    content,
    okText,
    okType: 'danger',
    cancelText: 'Cancel',
    centered: true,
    onOk,
  });
}
