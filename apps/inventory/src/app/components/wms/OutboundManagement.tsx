import * as React from 'react';

import {
    ArrowUpFromLine,
    ShieldCheck,
    Truck,
    Download,
    Upload,
    Loader2,
    FileUp,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';
import { useUserStore } from '@horizon-sync/store';

import { PickListView } from './PickListView';
import { GateVerificationPanel } from './GateVerificationPanel';
import { DispatchList } from './DispatchList';
import { outboundApi } from '../../utility/api/wms';
import type { PickList } from '../../types/wms.types';

// ============================================
// TYPES
// ============================================

type OutboundTab = 'pick' | 'gate' | 'dispatch';

interface OutboundManagementProps {
    warehouseId: string | null;
}

// ============================================
// IMPORT DIALOG
// ============================================

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accessToken: string | null;
    warehouseId: string | null;
}

function ImportDialog({ open, onClose, onSuccess, accessToken, warehouseId }: ImportDialogProps) {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [importing, setImporting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [mode, setMode] = React.useState<'csv' | 'pdf'>('csv');

    const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            // Auto-detect mode from extension
            if (file.name.endsWith('.pdf')) setMode('pdf');
            else setMode('csv');
        }
    }, []);

    const handleImport = React.useCallback(async () => {
        if (!selectedFile || !accessToken || !warehouseId) return;
        setImporting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const { buildUrl } = await import('../../utility/api/core');
            const url = buildUrl(`/outbound/import?warehouse_id=${warehouseId}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || `Import failed (${response.status})`);
            }

            const result = await response.json();
            const created = result?.pick_lists_created ?? result?.created ?? 0;
            const errors: string[] = result?.errors ?? [];

            let description = `${created} pick list(s) created from ${selectedFile.name}`;
            if (errors.length > 0) {
                description += `. ${errors.length} issue(s): ${errors.slice(0, 3).join('; ')}`;
                if (errors.length > 3) description += `...`;
            }

            window.dispatchEvent(new CustomEvent('app:toast', {
                detail: {
                    title: created > 0 ? '✅ Import Complete' : '⚠️ Import Finished',
                    description,
                },
            }));

            onClose();
            setSelectedFile(null);
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImporting(false);
        }
    }, [selectedFile, accessToken, warehouseId, onClose, onSuccess]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
                <h2 className="text-lg font-semibold">Import Pick List</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a PDF packing slip or CSV order file to generate a pick list.
                </p>

                {/* File drop zone */}
                <label
                    className={cn(
                        'flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer',
                        'hover:border-primary/50 hover:bg-muted/30 transition-colors',
                        selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                    )}
                >
                    <FileUp className={cn('h-8 w-8', selectedFile ? 'text-primary' : 'text-muted-foreground')} />
                    {selectedFile ? (
                        <div className="text-center">
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm font-medium">Click to browse</p>
                            <p className="text-xs text-muted-foreground">PDF or CSV (max 10MB)</p>
                        </div>
                    )}
                    <input
                        type="file"
                        accept=".csv,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { onClose(); setSelectedFile(null); setError(null); }}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!selectedFile || importing}>
                        {importing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-1" />
                                Import
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// HEADER
// ============================================

interface HeaderProps {
    activeTab: OutboundTab;
    warehouseId: string | null;
    onImportSuccess: () => void;
}

function OutboundHeader({ activeTab, warehouseId, onImportSuccess }: HeaderProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const [exporting, setExporting] = React.useState(false);
    const [importOpen, setImportOpen] = React.useState(false);

    const showActions = activeTab === 'pick';

    const handleExport = React.useCallback(async () => {
        if (!accessToken) return;
        setExporting(true);
        try {
            // Fetch all pages of pick lists
            const firstPage = await outboundApi.listPickLists(accessToken, { page: 1, page_size: 100 });
            let allPickLists: PickList[] = firstPage.pick_lists ?? [];
            const totalPages = (firstPage.pagination as { total_pages?: number })?.total_pages ?? 1;
            for (let p = 2; p <= totalPages; p++) {
                const page = await outboundApi.listPickLists(accessToken, { page: p, page_size: 100 });
                allPickLists = allPickLists.concat(page.pick_lists ?? []);
            }

            const headers = ['Pick List No', 'Status', 'Invoice Ref', 'Total Items', 'Picked Items', 'Warehouse', 'Created At', 'Completed At'];
            const rows = allPickLists.map((pl) => [
                pl.pick_list_no,
                pl.status,
                pl.invoice_reference ?? '',
                String(pl.progress?.total_items ?? pl.items?.length ?? 0),
                String(pl.progress?.picked_items ?? 0),
                pl.warehouse_id,
                pl.created_at ?? '',
                pl.completed_at ?? '',
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pick-lists-export.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            window.dispatchEvent(new CustomEvent('app:toast', {
                detail: { title: 'Export Complete', description: `${allPickLists.length} pick lists exported` },
            }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('app:toast', {
                detail: { title: 'Export Failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' },
            }));
        } finally {
            setExporting(false);
        }
    }, [accessToken]);

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Outbound Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage pick lists, gate verification, and dispatch records.
                    </p>
                </div>
                {showActions && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
                            <Upload className="h-4 w-4" />
                            Import Pick List
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
                            {exporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Export Pick Lists
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            <ImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onSuccess={onImportSuccess}
                accessToken={accessToken}
                warehouseId={warehouseId}
            />
        </>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OutboundManagement({ warehouseId }: OutboundManagementProps) {
    const [activeTab, setActiveTab] = React.useState<OutboundTab>('pick');
    const [gatePickListId, setGatePickListId] = React.useState('');
    const [refreshKey, setRefreshKey] = React.useState(0);

    const handleImportSuccess = React.useCallback(() => {
        setRefreshKey((k) => k + 1);
    }, []);

    return (
        <div className="space-y-4">
            <OutboundHeader activeTab={activeTab} warehouseId={warehouseId} onImportSuccess={handleImportSuccess} />

            <div className="border rounded-lg overflow-hidden">
                {/* Sub-tabs */}
                <div className="flex border-b">
                    <button
                        className={cn(
                            'px-4 py-2 text-sm font-medium',
                            activeTab === 'pick'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 hover:bg-muted',
                        )}
                        onClick={() => setActiveTab('pick')}
                    >
                        <span className="flex items-center gap-2">
                            <ArrowUpFromLine className="h-4 w-4" />
                            Pick Lists
                        </span>
                    </button>
                    <button
                        className={cn(
                            'px-4 py-2 text-sm font-medium',
                            activeTab === 'gate'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 hover:bg-muted',
                        )}
                        onClick={() => setActiveTab('gate')}
                    >
                        <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Gate Verification
                        </span>
                    </button>
                    <button
                        className={cn(
                            'px-4 py-2 text-sm font-medium',
                            activeTab === 'dispatch'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 hover:bg-muted',
                        )}
                        onClick={() => setActiveTab('dispatch')}
                    >
                        <span className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Dispatches
                        </span>
                    </button>
                </div>

                {/* Tab content */}
                <div className="p-4">
                    {activeTab === 'pick' && (
                        <PickListView key={refreshKey} warehouseId={warehouseId ?? undefined} />
                    )}

                    {activeTab === 'gate' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">Gate Verification</h3>
                                <p className="text-sm text-muted-foreground">
                                    Verify outbound shipments at the gate before dispatch. Enter a pick list ID to start.
                                </p>
                            </div>
                            <div className="max-w-lg space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        className="flex-1 font-mono text-sm"
                                        placeholder="Enter Pick List ID..."
                                        value={gatePickListId}
                                        onChange={(e) => setGatePickListId(e.target.value)}
                                    />
                                </div>
                                {gatePickListId && (
                                    <div className="border rounded-lg p-4 bg-card">
                                        <GateVerificationPanel
                                            pickListId={gatePickListId}
                                            onDispatchCreated={() => setActiveTab('dispatch')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'dispatch' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">Dispatch Records</h3>
                                <p className="text-sm text-muted-foreground">
                                    End-to-end traceability for all outbound shipments.
                                </p>
                            </div>
                            <DispatchList />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
