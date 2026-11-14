/** Pure HTTP helpers (no React Native imports) so they can be unit-tested with node --test. */

export class HttpError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, message: string, body = '') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

/** Joins the server base URL and a path, tolerating missing or doubled slashes. */
export function buildUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Pulls a human-readable message out of an error response body. The rider
 * API answers errors as JSON with `msg`, `error` or `message`. Falls back to
 * a generic message if the body is empty or not JSON.
 */
export function extractErrorMessage(bodyText: string, status: number): string {
  const fallback = `Request failed: ${status}`;
  if (!bodyText) return fallback;
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const candidate = record.msg ?? record.error ?? record.message;
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }
  } catch {
    // not JSON: keep the generic message
  }
  return fallback;
}

/** True for statuses worth retrying (server trouble or rate limiting). */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}
