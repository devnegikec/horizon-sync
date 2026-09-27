/**
 * Orchestration for the JSON import flow.
 *
 * Local state only: the parsed document, its diagnostics and the apply result. The
 * layout must not touch warehouse state until the server accepts it - mirroring the
 * rule that a failed save never touches the document.
 *
 * The local compiler runs first so the designer gets instant feedback without a round
 * trip; the server recompiles the posted document and remains the authority, so a
 * divergence here can only affect the preview.
 *
 * Design ref: ../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md sections 4 and 5
 */

import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { LayoutApplyResponse, LayoutDiagnostic, LayoutExample } from '../../../types/layoutDesign.types';
import { LayoutApplyRefusedError, layoutDesignApi } from '../../../utility/api/layoutDesign';
import { analyseLayoutDocument, describeFileProblem, parseLayoutJson, readLayoutFile, type ImportAnalysis } from '../services/layoutImport';

export interface UseLayoutImportOptions {
  warehouseId: string;
  /** Called after a successful apply, so the parent can refresh the 3D view. */
  onApplied?: () => void;
}

export interface UseLayoutImportResult {
  fileName: string | null;
  analysis: ImportAnalysis | null;
  parseError: string | null;
  applying: boolean;
  result: LayoutApplyResponse | null;
  /** Diagnostics the server returned on a refused apply (it is the authority). */
  serverDiagnostics: LayoutDiagnostic[];
  error: string | null;
  examples: LayoutExample[];
  loadText: (text: string, fileName?: string | null) => void;
  loadFile: (file: File) => Promise<void>;
  loadExample: (name: string) => Promise<void>;
  refreshExamples: () => Promise<void>;
  apply: (name: string, replaceExisting: boolean) => Promise<void>;
  reset: () => void;
}

export function useLayoutImport({ warehouseId, onApplied }: UseLayoutImportOptions): UseLayoutImportResult {
  const accessToken = useUserStore((s) => s.accessToken);

  const [fileName, setFileName] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<ImportAnalysis | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [result, setResult] = React.useState<LayoutApplyResponse | null>(null);
  const [serverDiagnostics, setServerDiagnostics] = React.useState<LayoutDiagnostic[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [examples, setExamples] = React.useState<LayoutExample[]>([]);

  const loadText = React.useCallback((text: string, name: string | null = null) => {
    setResult(null);
    setServerDiagnostics([]);
    setError(null);

    const parsed = parseLayoutJson(text);
    if (!parsed.ok) {
      setFileName(name);
      setAnalysis(null);
      setParseError(parsed.error);
      return;
    }

    setFileName(name);
    setParseError(null);
    setAnalysis(analyseLayoutDocument(parsed.document));
  }, []);

  const loadFile = React.useCallback(
    async (file: File) => {
      const problem = describeFileProblem(file);
      if (problem) {
        setFileName(file.name);
        setAnalysis(null);
        setParseError(problem);
        return;
      }
      loadText(await readLayoutFile(file), file.name);
    },
    [loadText],
  );

  const refreshExamples = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setExamples(await layoutDesignApi.listExamples(accessToken));
    } catch {
      // An unreachable example endpoint must not block the import flow.
      setExamples([]);
    }
  }, [accessToken]);

  const loadExample = React.useCallback(
    async (name: string) => {
      if (!accessToken) return;
      try {
        const example = await layoutDesignApi.getExample(accessToken, name);
        loadText(JSON.stringify(example.document, null, 2), `${name}.json`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the example layout');
      }
    },
    [accessToken, loadText],
  );

  const reset = React.useCallback(() => {
    setFileName(null);
    setAnalysis(null);
    setParseError(null);
    setResult(null);
    setServerDiagnostics([]);
    setError(null);
    setApplying(false);
  }, []);

  const apply = React.useCallback(
    async (name: string, replaceExisting: boolean) => {
      if (!accessToken || !analysis) return;
      setApplying(true);
      setError(null);
      setServerDiagnostics([]);
      try {
        const response = await layoutDesignApi.apply(accessToken, {
          warehouse_id: warehouseId,
          document: analysis.document,
          name,
          replace_existing: replaceExisting,
        });
        setResult(response);
        onApplied?.();
      } catch (err) {
        if (err instanceof LayoutApplyRefusedError) {
          // The server refused it: show the server's rules, not the local ones.
          setServerDiagnostics(err.diagnostics);
          setError(`${err.code}: the server rejected this layout`);
        } else {
          setError(err instanceof Error ? err.message : 'Apply failed');
        }
      } finally {
        setApplying(false);
      }
    },
    [accessToken, analysis, onApplied, warehouseId],
  );

  return {
    fileName,
    analysis,
    parseError,
    applying,
    result,
    serverDiagnostics,
    error,
    examples,
    loadText,
    loadFile,
    loadExample,
    refreshExamples,
    apply,
    reset,
  };
}
