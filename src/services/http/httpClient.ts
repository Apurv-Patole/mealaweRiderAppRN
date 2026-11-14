import { env, HTTP } from '@/config';

import { handleDemoRequest } from '@/features/demo/demoServer';
import { isDemoToken } from '@/features/demo/demoSession';

import { buildUrl, extractErrorMessage, HttpError } from './helpers';

/**
 * Fetch-based HTTP client for the rider API. The rider endpoints use plain JSON
 * with `Authorization: Bearer <jwt>` (unlike the customer app, there is no AES
 * body encryption). A 401 on an authenticated request means the session was
 * revoked (for example the rider logged in on another phone).
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Skip the global 401 handler (for example on the login calls). */
  skipUnauthorizedHandler?: boolean;
}

let authTokenProvider: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

/** Wire the auth store in at startup so requests carry the session token. */
export function setAuthTokenProvider(provider: () => string | null): void {
  authTokenProvider = provider;
}

/** Wire in what happens when an authenticated request comes back 401. */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, skipUnauthorizedHandler = false } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP.timeoutMs);
  const token = authTokenProvider();
  // Demo session: answered from memory, never sent to the network.
  if (isDemoToken(token)) return handleDemoRequest<T>(method, path, body);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  try {
    const response = await fetch(buildUrl(env.serverUrl, path), {
      method,
      signal: signal ?? controller.signal,
      headers: {
        // fetch must generate its own multipart boundary for FormData.
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      // Only react to a 401 for the token this request used; a late 401 for an
      // old token says nothing about the current session.
      if (response.status === 401 && token && token === authTokenProvider() && !skipUnauthorizedHandler) {
        unauthorizedHandler();
      }
      throw new HttpError(response.status, extractErrorMessage(text, response.status), text);
    }

    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (error: unknown) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(0, 'The request timed out. Check your connection and try again.');
    }
    if (__DEV__) {
      // The user-facing message hides why the request failed; developers need the real reason.
      // eslint-disable-next-line no-console
      console.warn(`[http] ${method} ${path} failed:`, error);
    }
    throw new HttpError(0, 'Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
