"use client";

import type { MessageInstance } from "antd/es/message/interface";
import {
  NETWORK_RESTORED_MESSAGE,
  NETWORK_UNAVAILABLE_MESSAGE,
} from "./errors";

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

function resolveNetworkToastKey(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  if (trimmed === NETWORK_UNAVAILABLE_MESSAGE) {
    return "cms-network-unavailable";
  }
  if (trimmed === NETWORK_RESTORED_MESSAGE) {
    return "cms-network-restored";
  }
  return null;
}

function buildDeduplicatedToast(
  type: "success" | "error",
  key: string,
  content: string,
  duration?: number | VoidFunction,
  onClose?: VoidFunction,
) {
  const api = ensureApi();
  if (key === "cms-network-restored") {
    api.destroy("cms-network-unavailable");
  }
  return api.open({
    key,
    type,
    content,
    duration: typeof duration === "number" ? duration : 3,
    onClose: typeof duration === "function" ? duration : onClose,
  });
}

export const message: Pick<
  MessageInstance,
  "success" | "error" | "info" | "warning" | "loading" | "open" | "destroy"
> = {
  success: (content, duration, onClose) => {
    const key = resolveNetworkToastKey(content);
    if (key) {
      return buildDeduplicatedToast(
        "success",
        key,
        String(content),
        duration,
        onClose,
      );
    }
    return ensureApi().success(content, duration, onClose);
  },
  error: (content, duration, onClose) => {
    const key = resolveNetworkToastKey(content);
    if (key) {
      return buildDeduplicatedToast(
        "error",
        key,
        String(content),
        duration,
        onClose,
      );
    }
    return ensureApi().error(content, duration, onClose);
  },
  info: (content, duration, onClose) =>
    ensureApi().info(content, duration, onClose),
  warning: (content, duration, onClose) =>
    ensureApi().warning(content, duration, onClose),
  loading: (content, duration, onClose) =>
    ensureApi().loading(content, duration, onClose),
  open: (config) => ensureApi().open(config),
  destroy: (...args) => ensureApi().destroy(...args),
};
