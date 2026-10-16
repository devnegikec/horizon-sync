/**
 * JSON Layout Designer API client.
 *
 * Base: `${apiCoreUrl}/api/v1/layout-design`
 *
 * Uses the same local `req()` + `headers()` helper as `floorplan.ts` (fetch, not
 * axios, with the token passed in explicitly from the user store).
 *
 * One deliberate difference from the older clients: a refused apply comes back as a
 * **structured** 400 (`{detail: {message, code, diagnostics}}`) where `code` is the
 * blocking *rule code*. That is unwrapped into `LayoutApplyRefusedError` so the UI can
 * show exactly which rule stopped the import instead of "[object Object]".
 *
 * Design ref: ../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 5
 */

import { environment } from '../../../environments/environment';
import type {
  LayoutApplyRequest,
  LayoutApplyResponse,
  LayoutDiagnostic,
  LayoutExample,
  LayoutPreviewResponse,
  LayoutRule,
  LayoutValidateResponse,
} from '../../types/layoutDesign.types';

const BASE = `${environment.apiCoreUrl}/api/v1/layout-design`;

/** Raised when the server refuses an apply because the document has blocking errors. */
export class LayoutApplyRefusedError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly diagnostics: LayoutDiagnostic[],
  ) {
    super(message);
    this.name = 'LayoutApplyRefusedError';
  }
}

interface FailureEnvelope {
  message: string;
  code?: string;
  diagnostics?: LayoutDiagnostic[];
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/** Unwrap the backend's `{detail: {message, status_code, code, …}}` envelope. */
async function readFailure(res: Response): Promise<FailureEnvelope> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    const detail = parsed?.detail;
    if (detail && typeof detail === 'object') {
      const envelope = detail as { message?: string; code?: string; diagnostics?: LayoutDiagnostic[] };
      return {
        message: envelope.message ?? `HTTP ${res.status}`,
        ...(envelope.code ? { code: envelope.code } : {}),
        ...(envelope.diagnostics ? { diagnostics: envelope.diagnostics } : {}),
      };
    }
    if (typeof detail === 'string') return { message: detail };
  } catch {
    /* not JSON - fall through to the raw body */
  }
  return { message: text || `HTTP ${res.status}` };
}

async function req<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { headers: headers(token), ...options });
  if (!res.ok) {
    const failure = await readFailure(res);
    if (failure.diagnostics) {
      throw new LayoutApplyRefusedError(failure.code ?? 'LAYOUT_DOC_NOT_APPLYABLE', failure.message, failure.diagnostics);
    }
    throw new Error(failure.message);
  }
  return res.json() as Promise<T>;
}

export const layoutDesignApi = {
  /** Compile a document and return its diagnostics. Nothing is written. */
  validate: (token: string, document: unknown) =>
    req<LayoutValidateResponse>(`${BASE}/validate`, token, {
      method: 'POST',
      body: JSON.stringify({ document }),
    }),

  /** Compile a document and return the derived bins, zones and plan geometry. */
  preview: (token: string, document: unknown, limit = 25) =>
    req<LayoutPreviewResponse>(`${BASE}/preview`, token, {
      method: 'POST',
      body: JSON.stringify({ document, limit }),
    }),

  /** Persist a document as the warehouse's location hierarchy. */
  apply: (token: string, body: LayoutApplyRequest) =>
    req<LayoutApplyResponse>(`${BASE}/apply`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** The diagnostic rule registry, so the UI can explain any code it received. */
  listRules: (token: string) => req<LayoutRule[]>(`${BASE}/rules`, token),

  /** Import templates served by the backend. */
  listExamples: (token: string) => req<LayoutExample[]>(`${BASE}/examples`, token),

  /** One import template by name. */
  getExample: (token: string, name: string) => req<LayoutExample>(`${BASE}/examples/${encodeURIComponent(name)}`, token),

  /** The document stored on a floor plan, for round-tripping. */
  getDocument: (token: string, floorPlanId: string) => req<Record<string, unknown>>(`${BASE}/${floorPlanId}/document`, token),
};
