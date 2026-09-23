import * as React from 'react';

import { AlertTriangle, CheckCircle2, Package } from 'lucide-react';

import type { CartonScanSummary } from '../../types/wms.types';

/**
 * Result of a master-carton receive (`POST /inbound/sessions/{id}/scan-carton`).
 * Shown before the worker ends the session so discrepancies are visible up
 * front: expected / received / duplicate / unexpected plus the per-serial list.
 */
export function CartonSummary({ summary }: { summary: CartonScanSummary }) {
    const totals: Array<[string, number]> = [
        ['Expected', summary.expected],
        ['Received', summary.received],
        ['Duplicate', summary.duplicate],
        ['Unexpected', summary.unexpected],
    ];

    const hasDiscrepancy = summary.unexpected > 0 || summary.duplicate > 0;

    return (
        <div className="space-y-3 rounded-lg border p-4" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <h3 className="font-semibold">Carton Receive Summary</h3>
                    {summary.carton_serial && <span className="font-mono text-xs text-muted-foreground">{summary.carton_serial}</span>}
                </div>
                {hasDiscrepancy ? (
                    <span className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" />
                        Discrepancy detected
                    </span>
                ) : (
                    <span className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Fully received
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {totals.map(([label, value]) => (
                    <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-lg font-semibold">{value}</p>
                    </div>
                ))}
            </div>

            {summary.serials.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 font-medium">Serial</th>
                                <th className="px-3 py-2 font-medium">SKU</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {summary.serials.map((line) => (
                                <tr key={line.serial_number}>
                                    <td className="px-3 py-2 font-mono">{line.serial_number}</td>
                                    <td className="px-3 py-2 font-mono text-muted-foreground">{line.sku ?? '—'}</td>
                                    <td className="px-3 py-2 capitalize">
                                        {line.status === 'received' ? (
                                            <span className="text-green-600 dark:text-green-400">{line.status}</span>
                                        ) : line.status === 'duplicate' ? (
                                            <span className="text-blue-600 dark:text-blue-400">{line.status}</span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400">{line.status}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
