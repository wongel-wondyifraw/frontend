"use client";

import type { MessageInstance } from "antd/es/message/interface";

/**
 * Context-aware antd message API.
 * Bound from ToastProvider (under <App>) so calls consume theme context
 * and avoid: "Static function can not consume context like dynamic theme".
 */
let messageApi: MessageInstance | null = null;

export function bindAppMessage(api: MessageInstance) {
  messageApi = api;
}

function ensureApi(): MessageInstance {
  if (!messageApi) {
    throw new Error(
      "antd message API is not ready — ensure ToastProvider is mounted under <App>",
    );
  }
  return messageApi;
}

export const message: Pick<
  MessageInstance,
  "success" | "error" | "info" | "warning" | "loading" | "open" | "destroy"
> = {
  success: (content, duration, onClose) =>
    ensureApi().success(content, duration, onClose),
  error: (content, duration, onClose) =>
    ensureApi().error(content, duration, onClose),
  info: (content, duration, onClose) =>
    ensureApi().info(content, duration, onClose),
  warning: (content, duration, onClose) =>
    ensureApi().warning(content, duration, onClose),
  loading: (content, duration, onClose) =>
    ensureApi().loading(content, duration, onClose),
  open: (config) => ensureApi().open(config),
  destroy: (...args) => ensureApi().destroy(...args),
};
