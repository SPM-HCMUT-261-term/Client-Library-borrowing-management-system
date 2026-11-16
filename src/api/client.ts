import { ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const AUTH_USER_KEY = 'bookborrow_auth_user';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T; message?: string }> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'include',
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      response.status,
      'NETWORK_PARSE_ERROR',
      `Unexpected non-JSON response (${response.status}) from ${url}`,
    );
  }

  if (!response.ok || !payload.success) {
    const rawError = !payload.success ? payload.error : undefined;
    const errObj =
      typeof rawError === 'string'
        ? { code: 'HTTP_ERROR', message: rawError }
        : rawError ?? { code: 'HTTP_ERROR', message: response.statusText };
    throw new ApiClientError(
      response.status,
      errObj.code || 'API_ERROR',
      errObj.message || 'An unexpected error occurred.',
      typeof rawError === 'object' && rawError ? rawError.details : undefined,
    );
  }

  return {
    data: payload.data,
    message: payload.message,
  };
}
