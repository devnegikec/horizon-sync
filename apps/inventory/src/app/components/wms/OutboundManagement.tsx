import * as React from 'react';

import {
    ArrowUpFromLine,
    ShieldCheck,
    Truck,
    Download,
    Upload,
    Loader2,
    FileUp,
    FileDown,
    Plus,
    ChevronDown,
    Trash2,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';
import { useUserStore } from '@horizon-sync/store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

import { environment } from '../../../environments/environment';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';
import { PickListView } from './PickListView';
import { GateVerificationPanel } from './GateVerificationPanel';
import { DispatchList } from './DispatchList';
import { outboundApi } from '../../utility/api/wms';
import type { PickList, SAPInvoicePayload } from '../../types/wms.types';

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

const SAMPLE_ORDER_CSV = `invoice_reference,sku,description,quantity,uom
INV-1001,PPI-SKO-89,Prestige Digi Kettle 2.0 Litre with 6 Preset Modes,2,Nos
INV-1001,PPI-SKO-90,Prestige Deluxe Plus Aluminium Outer Lid Pressure Pan, Silver,2,Nos
`;

function downloadSampleCsv() {
    const blob = new Blob([SAMPLE_ORDER_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'incoming-order-sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                <h2 className="text-lg font-semibold">Import Incoming Order</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a PDF packing slip or CSV order file to generate a pick list.
                </p>
                <Button variant="ghost" size="sm" className="gap-2 w-fit" onClick={downloadSampleCsv}>
                    <FileDown className="h-4 w-4" />
                    Download sample CSV
                </Button>

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
// CREATE PICK LIST DIALOG
// ============================================

interface PickerItem {
    id: string;
    item_code: string;
    item_name: string;
    uom: string | null;
    standard_rate: string | null;
}

interface CreateLineRow {
    key: string;
    item_id: string;
    sku: string;
    quantity: number;
    uom: string;
}

interface CreatePickListDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accessToken: string | null;
    warehouseId: string | null;
}

function makeKey() {
    return Math.random().toString(36).slice(2);
}

function CreatePickListDialog({ open, onClose, onSuccess, accessToken, warehouseId }: CreatePickListDialogProps) {
    const [invoiceRef, setInvoiceRef] = React.useState('');
    const [lines, setLines] = React.useState<CreateLineRow[]>([
        { key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' },
    ]);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const itemsCacheRef = React.useRef<Map<string, PickerItem>>(new Map());

    const searchItems = React.useCallback(async (query: string): Promise<PickerItem[]> => {
        if (!accessToken || !warehouseId) return [];
        const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}&warehouse_id=${encodeURIComponent(warehouseId)}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        const items: PickerItem[] = data.items ?? [];
        items.forEach((it) => itemsCacheRef.current.set(it.id, it));
        return items;
    }, [accessToken, warehouseId]);

    const updateLine = React.useCallback((key: string, patch: Partial<CreateLineRow>) => {
        setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    }, []);

    const handleSelectItem = React.useCallback((key: string, itemId: string) => {
        const item = itemsCacheRef.current.get(itemId);
        updateLine(key, {
            item_id: itemId,
            sku: item?.item_code ?? '',
            uom: item?.uom || 'pcs',
        });
    }, [updateLine]);

    const addLine = React.useCallback(() => {
        setLines((prev) => [...prev, { key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' }]);
    }, []);

    const removeLine = React.useCallback((key: string) => {
        setLines((prev) => prev.filter((l) => l.key !== key));
    }, []);

    const handleSubmit = async () => {
        if (!accessToken || !warehouseId) return;
        if (!invoiceRef.trim()) {
            setError('Invoice reference is required');
            return;
        }
        const validLines = lines.filter((l) => l.item_id);
        if (validLines.length === 0) {
            setError('Add at least one item');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload: SAPInvoicePayload = {
                invoice_reference: invoiceRef.trim(),
                warehouse_id: warehouseId,
                items: validLines.map((l) => ({
                    item_id: l.item_id,
                    sku: l.sku,
                    quantity: Number(l.quantity) || 0,
                    uom: l.uom || 'pcs',
                })),
            };
            await outboundApi.createFromInvoice(accessToken, payload);
            window.dispatchEvent(new CustomEvent('app:toast', {
                detail: { title: 'Pick List Created', description: `Pick list created for invoice ${invoiceRef.trim()}` },
            }));
            setInvoiceRef('');
            setLines([{ key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' }]);
            onClose();
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create pick list');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl shadow-xl border w-full max-w-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">Create Pick List</h2>
                <p className="text-sm text-muted-foreground">
                    Create a pick list from an incoming order (invoice).
                </p>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Reference</label>
                    <Input
                        value={invoiceRef}
                        onChange={(e) => setInvoiceRef(e.target.value)}
                        placeholder="e.g. INV-1001"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Items</label>
                        <Button variant="ghost" size="sm" onClick={addLine} className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {lines.map((line) => (
                            <div key={line.key} className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <ItemPickerSelect<PickerItem>
                                        value={line.item_id}
                                        onValueChange={(id) => handleSelectItem(line.key, id)}
                                        searchItems={searchItems}
                                        labelFormatter={(it) => `${it.item_name} (${it.item_code})`}
                                        valueKey="id"
                                        placeholder="Search item..."
                                    />
                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    className="w-24"
                                    value={line.quantity}
                                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                                />
                                <Input
                                    className="w-20"
                                    value={line.uom}
                                    onChange={(e) => updateLine(line.key, { uom: e.target.value })}
                                    placeholder="pcs"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeLine(line.key)}
                                    disabled={lines.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
                )}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        Create Pick List
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
    const [createOpen, setCreateOpen] = React.useState(false);

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Import/Export Incoming Order
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setImportOpen(true)}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Incoming Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                                    {exporting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Export Pick Lists
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            New
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

            <CreatePickListDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
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
