/**
 * Structured API error that preserves HTTP status code and
 * extracts the backend's `{ detail: "..." }` message format.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly detail: string | null;

  constructor(status: number, statusText: string, body: string) {
    const detail = ApiError.extractDetail(body);
    const message = detail || `HTTP ${status}: ${statusText}`;

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }

  /** Try to parse `{ "detail": "..." }` from the response body. */
  private static extractDetail(body: string): string | null {
    try {
      const parsed = JSON.parse(body);

      // FastAPI standard: { detail: "string" }
      if (typeof parsed?.detail === 'string') {
        return parsed.detail;
      }

      // FastAPI structured: { detail: { message: "string" } }
      if (typeof parsed?.detail?.message === 'string') {
        return parsed.detail.message;
      }

      // Fallback: plain string body
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      // Body is not JSON — return raw text if non-empty
      if (body.trim().length > 0) {
        return body.trim();
      }
    }
    return null;
  }

  /** True when the server says the session is expired / invalid. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True for permission-denied responses. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True for not-found responses. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True for state-conflict responses (e.g. wrong status for action). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** True for validation errors. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** True when a feature is administratively disabled (HTTP 423 Locked). */
  get isFeatureDisabled(): boolean {
    return this.status === 423;
  }
}
