"use client";

import { Modal } from "antd";
import { globalModal } from "@/Components/common/AntdAppExtractor";

type ConfirmDeleteOptions = {
  title?: string;
  content?: string;
  okText?: string;
  onOk: () => void | Promise<void>;
};

/** Shared destructive-action confirmation used across the CMS. */
export function confirmDelete({
  title = "Delete this item?",
  content = "This action cannot be undone.",
  okText = "Delete",
  onOk,
}: ConfirmDeleteOptions): void {
  const modalFn = globalModal ? globalModal.confirm : Modal.confirm;

  modalFn({
    title,
    content,
    okText,
    okType: "danger",
    cancelText: "Cancel",
    centered: true,
    onOk,
  });
}
