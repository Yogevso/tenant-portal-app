import { env } from "../config/env";

export interface ApiValidationDetail {
  field: string;
  message: string;
  type: string;
  input?: unknown;
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: ApiValidationDetail[] | null;
  };
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  accessToken?: string;
  body?: BodyInit | FormData | Record<string, unknown> | undefined;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiValidationDetail[] | null;
  headers: Headers;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      details?: ApiValidationDetail[] | null;
      headers: Headers;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? "http_error";
    this.details = options.details ?? null;
    this.headers = options.headers;
  }
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/api/") ? path : `/api/v1${path}`;
  const baseUrl =
    env.apiBaseUrl === "same-origin" && typeof window !== "undefined"
      ? window.location.origin
      : env.apiBaseUrl;

  return new URL(normalizedPath, baseUrl).toString();
}

function isFormData(value: BodyInit | FormData | Record<string, unknown> | undefined): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { accessToken, body, headers: headersInit, ...requestInit } = options;
  const headers = new Headers(headersInit);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormData(body) || typeof body === "string" || body instanceof Blob) {
      requestBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(buildApiUrl(path), {
    ...requestInit,
    headers,
    body: requestBody,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const errorBody = (payload as ApiErrorEnvelope | undefined)?.error;

    throw new ApiError(errorBody?.message ?? "Request could not be completed.", {
      status: response.status,
      code: errorBody?.code,
      details: errorBody?.details ?? null,
      headers: response.headers,
    });
  }

  if (response.status === 204 || payload === undefined) {
    return undefined as T;
  }

  return payload as T;
}
