import * as React from 'react';

import { AlertTriangle, Info } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';

import type { LayoutDiagnostic } from '../../../types/layoutDesign.types';

interface LayoutDiagnosticsTableProps {
  diagnostics: LayoutDiagnostic[];
  /** How many rows to render before collapsing the rest into a count. */
  limit?: number;
}

/** The entity a diagnostic points at, when it names one. */
function entityLabel(diagnostic: LayoutDiagnostic): string | null {
  const ref = diagnostic.entity_refs[0];
  return ref ? `${ref.kind} ${ref.label}` : null;
}

/**
 * Renders compiler diagnostics grouped by severity.
 *
 * A 1,500-bin document can produce many findings, so the list is capped and the
 * remainder summarised rather than followed by a wall of rows.
 */
export function LayoutDiagnosticsTable({ diagnostics, limit = 12 }: LayoutDiagnosticsTableProps) {
  if (diagnostics.length === 0) return null;

  const shown = diagnostics.slice(0, limit);
  const hidden = diagnostics.length - shown.length;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Diagnostics</p>
      <ul className="space-y-1.5">
        {shown.map((diagnostic, index) => (
          <li key={`${diagnostic.code}-${index}`} className="flex items-start gap-2 rounded-md border p-2">
            {diagnostic.severity === 'error' ? (
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
            ) : (
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={diagnostic.severity === 'error' ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0 font-mono">
                  {diagnostic.code}
                </Badge>
                {entityLabel(diagnostic) !== null && (
                  <span className="text-[10px] text-muted-foreground">{entityLabel(diagnostic)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground break-words">{diagnostic.message}</p>
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && <p className="text-[10px] text-muted-foreground">+{hidden} more…</p>}
    </div>
  );
}
