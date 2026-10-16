/**
 * Layout import service - the seam between a file on disk and the pure compiler.
 *
 * Everything here is synchronous and side-effect free except `readLayoutFile`, which
 * is the single place that touches the `File` API. That keeps `analyseLayoutDocument`
 * testable without a DOM, and lets the dialog validate on every keystroke.
 *
 * It also normalises the compiler's output into the **wire** shapes
 * (`types/layoutDesign.types.ts`), so the UI deals with exactly one diagnostic shape
 * whether it came from the local engine or from the server.
 *
 * Design ref: ../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 4
 */

import type { LayoutDiagnostic, LayoutSummary } from '../../../types/layoutDesign.types';
import { blockingCode, buildLayout, sampleBinPaths, summaryOf, type Diagnostic, type LayoutSummary as EngineSummary } from '../layout-core';

/** Refuse absurdly large files before parsing them into memory. */
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

/** The compiler's verdict, in the shape the UI and the API both speak. */
export interface ImportAnalysis {
  document: Record<string, unknown>;
  summary: LayoutSummary;
  diagnostics: LayoutDiagnostic[];
  applyable: boolean;
  blockingCode: string | null;
  sampleBinPaths: string[];
}

export type ParseResult = { ok: true; document: Record<string, unknown> } | { ok: false; error: string };

/** The compiler's diagnostic, restated in the wire shape. */
export function toWireDiagnostics(diagnostics: readonly Diagnostic[]): LayoutDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    entity_refs: diagnostic.entityRefs.map((ref) => ({ kind: ref.kind, id: ref.id, label: ref.label })),
    data: diagnostic.data ?? null,
  }));
}

/** The compiler's summary, restated in the wire shape. */
export function toWireSummary(summary: EngineSummary): LayoutSummary {
  return {
    zones: summary.zones,
    aisles: summary.aisles,
    lanes: summary.lanes,
    rack_types: summary.rackTypes,
    obstacles: summary.obstacles,
    bays: summary.bays,
    active_bays: summary.activeBays,
    levels: summary.levels,
    bins: summary.bins,
    errors: summary.errors,
    warnings: summary.warnings,
  };
}

/**
 * Parse pasted or uploaded text into a layout document.
 *
 * Returns an error string rather than throwing, because "that file is not valid JSON"
 * is a message for the designer, not an exception for the console.
 */
export function parseLayoutJson(text: string): ParseResult {
  if (!text.trim()) {
    return { ok: false, error: 'The layout document is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `Not valid JSON: ${error.message}` : 'Not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'A layout document must be a JSON object.' };
  }

  return { ok: true, document: parsed as Record<string, unknown> };
}

/** Compile a document locally and describe the result. */
export function analyseLayoutDocument(document: Record<string, unknown>): ImportAnalysis {
  const compiled = buildLayout(document);

  return {
    document,
    summary: toWireSummary(summaryOf(compiled)),
    diagnostics: toWireDiagnostics(compiled.diagnostics),
    applyable: compiled.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    blockingCode: blockingCode(compiled),
    sampleBinPaths: sampleBinPaths(compiled, 8),
  };
}

/** Read a file as text. The only impure call in this module. */
export async function readLayoutFile(file: File): Promise<string> {
  return file.text();
}

/** Reject a file that cannot be a layout document before reading it. */
export function describeFileProblem(file: File): string | null {
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_IMPORT_BYTES) return `"${file.name}" is larger than ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB.`;
  return null;
}
