import axios from "axios";

export const NETWORK_UNAVAILABLE_MESSAGE = "Network unavailable";
export const NETWORK_RESTORED_MESSAGE = "Network restored";

export const NETWORK_EVENT = {
  UNAVAILABLE: "cms:network-unavailable",
  REACHABLE: "cms:network-reachable",
  RESTORED: "cms:network-restored",
} as const;

export type NetworkEventName =
  (typeof NETWORK_EVENT)[keyof typeof NETWORK_EVENT];

export function emitNetworkSignal(type: NetworkEventName): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(type));
}

const NETWORK_MESSAGE_PATTERN =
  /^(network error|networkerror when attempting to fetch resource\.?|network unavailable|failed to fetch|load failed|fetch failed|the internet connection appears to be offline\.?|timeout of \d+ms exceeded|loading (?:css )?chunk .+ failed\.?(?:\s*\([\s\S]*\))?|chunkloaderror(?:: .+)?|net::err_[a-z0-9_]+)$/i;

const API_URL_LEAK_PATTERN =
  /unable to reach the api|check that the backend is running|connect econnrefused|getaddrinfo enotfound/i;

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as { statusCode?: unknown; status?: unknown };
  if (typeof candidate.statusCode === "number") return candidate.statusCode;
  if (typeof candidate.status === "number") return candidate.status;
  return undefined;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "";
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }
  return "";
}

export function isNetworkUnavailableError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === "object" && error !== null) {
    if (
      "isNetworkError" in error &&
      (error as { isNetworkError?: unknown }).isNetworkError === true
    ) {
      return true;
    }
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      return false;
    }
    if (!error.response) {
      return true;
    }
    return false;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }

  const httpStatus = getHttpStatus(error);
  const rawMessage = extractErrorMessage(error);

  if (rawMessage && API_URL_LEAK_PATTERN.test(rawMessage)) {
    return true;
  }

  if (error instanceof Error && error.name === "ChunkLoadError") {
    return true;
  }

  if (httpStatus === undefined) {
    if (rawMessage && NETWORK_MESSAGE_PATTERN.test(rawMessage.trim())) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return true;
    }
  }

  return false;
}

function sanitizeMessageText(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (
    NETWORK_MESSAGE_PATTERN.test(trimmed) ||
    API_URL_LEAK_PATTERN.test(trimmed)
  ) {
    return NETWORK_UNAVAILABLE_MESSAGE;
  }
  return trimmed;
}

export class ApiRequestError extends Error {
  statusCode?: number;
  status?: number;
  isNetworkError?: boolean;

  constructor(
    message: string,
    statusCode?: number,
    options?: { isNetworkError?: boolean },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.isNetworkError = options?.isNetworkError;
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Request failed",
): string {
  if (isNetworkUnavailableError(error)) {
    return NETWORK_UNAVAILABLE_MESSAGE;
  }
  if (error instanceof Error) {
    return sanitizeMessageText(error.message || "", fallback);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") {
      return sanitizeMessageText(message, fallback);
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return sanitizeMessageText(message[0], fallback);
    }
  }
  return fallback;
}

export function getAxiosErrorMessage(
  error: unknown,
  fallback = "Request failed",
): string {
  if (isNetworkUnavailableError(error)) {
    return NETWORK_UNAVAILABLE_MESSAGE;
  }
  if (axios.isAxiosError(error)) {
    if (!error.response && error.code !== "ERR_CANCELED") {
      return NETWORK_UNAVAILABLE_MESSAGE;
    }
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const raw = Array.isArray(data?.message) ? data.message[0] : data?.message;
    if (typeof raw === "string") {
      return sanitizeMessageText(raw, fallback);
    }
    if (error.message) {
      return sanitizeMessageText(error.message, fallback);
    }
  }
  return getApiErrorMessage(error, fallback);
}
