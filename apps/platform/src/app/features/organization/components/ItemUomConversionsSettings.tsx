import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Plus, Save, Upload, Trash2, RotateCcw, AlertCircle, Download, ChevronDown, FileDown, Loader2, Search, Check } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useDebouncedValue } from '../../search/hooks/useDebouncedValue';

import { UomService, type Uom } from '../../../services/uom.service';
import { itemService, type ItemListItem } from '../../../services/item.service';
import {
    uomConversionService,
    type BulkConversionRow,
    type UomConversion,
} from '../../../services/uomConversion.service';

interface ItemUomConversionsSettingsProps {
    accessToken: string;
    canEdit: boolean;
}

interface ConversionRow {
    key: string;
    item_id: string | null;
    from_uom: string;
    to_uom: string;
    from_uom_id: string | null;
    to_uom_id: string | null;
    conversion_factor: string;
    isNew: boolean;
}

let rowCounter = 0;
function nextKey(): string {
    rowCounter += 1;
    return `row-${Date.now()}-${rowCounter}`;
}

function rowFromConversion(c: UomConversion): ConversionRow {
    return {
        key: nextKey(),
        item_id: c.item_id,
        from_uom: c.from_uom,
        to_uom: c.to_uom,
        from_uom_id: c.from_uom_id,
        to_uom_id: c.to_uom_id,
        conversion_factor: String(c.conversion_factor ?? ''),
        isNew: false,
    };
}

function csvEscape(value: string | number | null | undefined): string {
    const s = value == null ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
    return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

function parseCsv(text: string, delimiter = ','): string[][] {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === delimiter) {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i += 1;
            row.push(field);
            field = '';
            if (row.some((c) => c.trim() !== '')) rows.push(row);
            row = [];
        } else {
            field += ch;
        }
    }
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    return rows;
}

function detectDelimiter(text: string): string {
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const count = (d: string) => firstLine.split(d).length - 1;
    const tabs = count('\t');
    const semis = count(';');
    const commas = count(',');
    if (tabs > 0 && tabs >= commas) return '\t';
    if (semis > 0 && semis >= commas) return ';';
    return ',';
}

function parseConversionCsv(text: string): BulkConversionRow[] {
    const rows = parseCsv(text, detectDelimiter(text));
    if (rows.length === 0) throw new Error('CSV is empty');
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const itemIdIdx = idx('item_id');
    const fromIdx = idx('from_uom');
    const toIdx = idx('to_uom');
    const factorIdx = idx('conversion_factor');
    const actionIdx = idx('action');
    if (itemIdIdx < 0 || fromIdx < 0 || toIdx < 0) {
        throw new Error('CSV header must include: item_id, from_uom, to_uom');
    }
    const result: BulkConversionRow[] = [];
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const item_id = (r[itemIdIdx] ?? '').trim() || null;
        const from_uom = (r[fromIdx] ?? '').trim();
        const to_uom = (r[toIdx] ?? '').trim();
        const factor = parseFloat((r[factorIdx] ?? '').trim());
        const actionRaw = (r[actionIdx] ?? '').trim().toLowerCase();
        const action =
            actionRaw === 'create' || actionRaw === 'modify' || actionRaw === 'delete'
                ? actionRaw
                : 'create';
        result.push({
            item_id,
            from_uom,
            to_uom,
            conversion_factor: Number.isFinite(factor) ? factor : 1,
            action,
        });
    }
    return result;
}

function ItemSearchCombobox({
    value,
    onValueChange,
    disabled,
    itemById,
    searchItems,
}: {
    value: string | null;
    onValueChange: (id: string) => void;
    disabled: boolean;
    itemById: Map<string, ItemListItem>;
    searchItems: (query: string) => Promise<ItemListItem[]>;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ItemListItem[]>([]);
    const [searching, setSearching] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 300);

    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }
        let cancelled = false;
        setSearching(true);
        searchItems(q)
            .then((res) => {
                if (!cancelled) {
                    setResults(res);
                    setSearching(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResults([]);
                    setSearching(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, searchItems]);

    const selected = value ? itemById.get(value) : undefined;
    const label = selected
        ? `${selected.item_name}${selected.item_code ? ` (${selected.item_code})` : ''}`
        : 'Select item';

    const handleSelect = (item: ItemListItem) => {
        onValueChange(item.id);
        setOpen(false);
        setQuery('');
        setResults([]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>{label}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search items..."
                        className="pl-8"
                        autoFocus
                    />
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto">
                    {searching ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching…
                        </div>
                    ) : query.trim().length < 2 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Type at least 2 characters to search
                        </p>
                    ) : results.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No items found</p>
                    ) : (
                        results.map((it) => (
                            <button
                                key={it.id}
                                type="button"
                                onClick={() => handleSelect(it)}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                <span>
                                    {it.item_name}
                                    {it.item_code ? ` (${it.item_code})` : ''}
                                </span>
                                {it.id === value && <Check className="h-4 w-4" />}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ItemUomConversionsSettings({ accessToken, canEdit }: ItemUomConversionsSettingsProps) {
    const { toast } = useToast();
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [rows, setRows] = useState<ConversionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [exportFileName, setExportFileName] = useState('items-uom-export');
    const [deletedRows, setDeletedRows] = useState<ConversionRow[]>([]);

    const itemById = useMemo(() => {
        const map = new Map<string, ItemListItem>();
        items.forEach((i) => map.set(i.id, i));
        return map;
    }, [items]);

    const uomByName = useMemo(() => {
        const map = new Map<string, Uom>();
        uoms.forEach((u) => map.set(u.name, u));
        return map;
    }, [uoms]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [uomsData, conversionsData] = await Promise.all([
                UomService.list(accessToken),
                uomConversionService.list(accessToken),
            ]);
            setUoms(uomsData);
            setRows(conversionsData.map(rowFromConversion));
            setDeletedRows([]);
            // Hydrate item details only for items already referenced by
            // conversions instead of eagerly loading the full item list.
            const itemIds = Array.from(
                new Set(conversionsData.map((c) => c.item_id).filter((id): id is string => !!id)),
            );
            if (itemIds.length > 0) {
                const settled = await Promise.allSettled(itemIds.map((id) => itemService.get(accessToken, id)));
                setItems(
                    settled
                        .filter((r): r is PromiseFulfilledResult<ItemListItem> => r.status === 'fulfilled')
                        .map((r) => r.value),
                );
            } else {
                setItems([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load items and conversions');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        load();
    }, [load]);

    const searchItems = useCallback(async (query: string): Promise<ItemListItem[]> => {
        const results = await itemService.search(accessToken, query);
        setItems((prev) => {
            const map = new Map(prev.map((i) => [i.id, i]));
            results.forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
        });
        return results;
    }, [accessToken]);

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                key: nextKey(),
                item_id: null,
                from_uom: '',
                to_uom: '',
                from_uom_id: null,
                to_uom_id: null,
                conversion_factor: '1',
                isNew: true,
            },
        ]);
    };

    const updateRow = (key: string, patch: Partial<ConversionRow>) => {
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    };

    const removeRow = (key: string) => {
        const row = rows.find((r) => r.key === key);
        if (row && !row.isNew) {
            setDeletedRows((prev) => [...prev, row]);
        }
        setRows((prev) => prev.filter((r) => r.key !== key));
    };

    const buildRows = (): { payload: BulkConversionRow[]; valid: boolean } => {
        const payload: BulkConversionRow[] = [];
        let valid = true;
        // Rows removed from the UI must be explicitly deleted server-side;
        // otherwise the next reload brings them back. Delete first so a
        // re-added conversion of the same key is recreated after deletion.
        for (const r of deletedRows) {
            if (!r.item_id || !r.from_uom || !r.to_uom) continue;
            payload.push({
                item_id: r.item_id,
                from_uom: r.from_uom,
                to_uom: r.to_uom,
                from_uom_id: r.from_uom_id || null,
                to_uom_id: r.to_uom_id || null,
                conversion_factor: Number(r.conversion_factor) || 1,
                action: 'delete',
            });
        }
        for (const r of rows) {
            if (!r.item_id || !r.from_uom || !r.to_uom) {
                valid = false;
                continue;
            }
            const factor = parseFloat(r.conversion_factor);
            if (!Number.isFinite(factor) || factor <= 0) {
                valid = false;
                continue;
            }
            payload.push({
                item_id: r.item_id,
                from_uom: r.from_uom,
                to_uom: r.to_uom,
                from_uom_id: r.from_uom_id || null,
                to_uom_id: r.to_uom_id || null,
                conversion_factor: factor,
            });
        }
        return { payload, valid };
    };

    const handleSave = async () => {
        const { payload, valid } = buildRows();
        if (!valid) {
            toast({
                title: 'Validation',
                description: 'Every row needs an item, both UOMs, and a factor greater than 0.',
                variant: 'destructive',
            });
            return;
        }
        if (payload.length === 0) {
            toast({ title: 'Nothing to save', description: 'Add at least one conversion row.' });
            return;
        }
        setSaving(true);
        try {
            const res = await uomConversionService.bulkUpsert(accessToken, payload);
            if (res.errors.length > 0) {
                toast({
                    title: 'Partial success',
                    description: `${res.created} created, ${res.updated} updated, ${res.errors.length} failed.`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: `${res.created} created, ${res.updated} updated.`,
                });
            }
            await load();
        } catch (e) {
            toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Failed to save conversions',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadSample = () => {
        const csv = toCsv([
            ['item_id', 'from_uom', 'to_uom', 'conversion_factor', 'action'],
            ['<uuid>', 'pcs', 'box', '12', 'CREATE'],
            ['<uuid>', 'pcs', 'box', '1', 'DELETE'],
        ]);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'items-uom-import-sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleImportSubmit = async () => {
        if (!selectedFile) {
            toast({
                title: 'Error',
                description: 'Please select a CSV file to import.',
                variant: 'destructive',
            });
            return;
        }
        setIsImporting(true);
        try {
            const text = await selectedFile.text();
            const parsed = parseConversionCsv(text);
            const res = await uomConversionService.bulkUpsert(accessToken, parsed);
            setIsImportOpen(false);
            setSelectedFile(null);
            toast({
                title: 'Import complete',
                description: `${res.created} created, ${res.updated} updated${res.deleted ? `, ${res.deleted} deleted` : ''}${res.errors.length ? `, ${res.errors.length} failed` : ''}.`,
                variant: res.errors.length ? 'destructive' : 'default',
            });
            await load();
        } catch (e) {
            toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Import failed',
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportSubmit = () => {
        const csv = toCsv([
            ['item_id', 'from_uom', 'to_uom', 'conversion_factor', 'action'],
            ...rows
                .filter((r) => r.item_id && r.from_uom && r.to_uom)
                .map((r) => [r.item_id ?? '', r.from_uom, r.to_uom, r.conversion_factor, 'CREATE']),
        ]);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFileName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExportOpen(false);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                    <div className="flex-1">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={load}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Set each item's UOM conversion factors. Changes reflect on the item and its linked product.
                </p>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Import/Export
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsExportOpen(true)}>
                                <Download className="h-4 w-4" />
                                Export
                            </DropdownMenuItem>
                            {canEdit && (
                                <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                                    <Upload className="h-4 w-4" />
                                    Import
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {canEdit && (
                        <>
                            <Button variant="outline" size="sm" className="gap-2" onClick={addRow}>
                                <Plus className="h-3.5 w-3.5" />
                                Add Conversion
                            </Button>
                            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
                                <Save className="h-3.5 w-3.5" />
                                {saving ? 'Saving…' : 'Save All'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No UOM conversions yet. Add one manually or import a CSV file.
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((row) => {
                        const item = row.item_id ? itemById.get(row.item_id) : undefined;
                        return (
                            <div
                                key={row.key}
                                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] sm:items-end"
                            >
                                <div className="space-y-1">
                                    <Label>Item</Label>
                                    <ItemSearchCombobox
                                        value={row.item_id}
                                        onValueChange={(v) => updateRow(row.key, { item_id: v })}
                                        disabled={!canEdit}
                                        itemById={itemById}
                                        searchItems={searchItems}
                                    />
                                    {item && (
                                        <p className="text-xs text-muted-foreground">Base UOM: {item.uom ?? '—'}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label>From UOM</Label>
                                    <Select
                                        value={row.from_uom}
                                        disabled={!canEdit}
                                        onValueChange={(v) => {
                                            const u = uomByName.get(v);
                                            updateRow(row.key, { from_uom: v, from_uom_id: u?.id ?? null });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="From" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uoms.map((u) => (
                                                <SelectItem key={u.id} value={u.name}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label>To UOM</Label>
                                    <Select
                                        value={row.to_uom}
                                        disabled={!canEdit}
                                        onValueChange={(v) => {
                                            const u = uomByName.get(v);
                                            updateRow(row.key, { to_uom: v, to_uom_id: u?.id ?? null });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="To" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uoms.map((u) => (
                                                <SelectItem key={u.id} value={u.name}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label>Factor</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={row.conversion_factor}
                                        disabled={!canEdit}
                                        onChange={(e) => updateRow(row.key, { conversion_factor: e.target.value })}
                                        placeholder="1"
                                    />
                                </div>

                                {canEdit && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRow(row.key)}
                                        title="Remove"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Conversions</DialogTitle>
                        <DialogDescription>
                            Download your item UOM conversions as a CSV file.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="conversion-export-name">File Name</Label>
                            <Input
                                id="conversion-export-name"
                                value={exportFileName}
                                onChange={(e) => setExportFileName(e.target.value)}
                                placeholder="items-uom-export"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportSubmit}>Export</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isImportOpen}
                onOpenChange={(open) => {
                    setIsImportOpen(open);
                    if (!open) setSelectedFile(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Conversions</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to create, modify, or delete item UOM conversions.
                            Blank or invalid action defaults to CREATE.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between rounded-md border border-dashed p-3 bg-muted/40">
                            <div className="text-sm">
                                <p className="font-medium">Need a template?</p>
                                <p className="text-muted-foreground">Download the sample CSV to see the required columns.</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadSample}
                                className="shrink-0 ml-4 gap-1.5"
                            >
                                <FileDown className="h-4 w-4" />
                                Sample CSV
                            </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="conversion-file-upload" className="text-sm font-medium">
                                Select File
                            </Label>
                            {!selectedFile ? (
                                <label
                                    htmlFor="conversion-file-upload"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm font-medium text-primary">Click to select file</span>
                                    <span className="text-xs text-muted-foreground mt-1">CSV (.csv)</span>
                                </label>
                            ) : (
                                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                                    <Upload className="h-5 w-5 text-primary shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFile(null)}
                                        disabled={isImporting}
                                    >
                                        Change
                                    </Button>
                                </div>
                            )}
                            <input
                                id="conversion-file-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isImporting}
                                className="hidden"
                            />
                        </div>

                        {isImporting && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Uploading and processing…</p>
                                    <p className="text-muted-foreground">This may take a moment.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsImportOpen(false);
                                setSelectedFile(null);
                            }}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importing…
                                </>
                            ) : (
                                'Import'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
