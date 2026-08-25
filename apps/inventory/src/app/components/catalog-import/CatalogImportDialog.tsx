import * as React from 'react';

import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
} from '@horizon-sync/ui/components';
import { useUserStore } from '@horizon-sync/store';

import {
    catalogImportApi,
    type CatalogImportMode,
    type CatalogImportResponse,
    type CatalogImportRow,
} from '../../utility/api/catalog-import';

const MODE_OPTIONS: { value: CatalogImportMode; label: string; hint: string }[] = [
    { value: 'product_only', label: 'Product only', hint: 'Creates/updates shared catalog products only.' },
    { value: 'product_with_items', label: 'Product + Items', hint: 'Creates products and linked inventory items.' },
    { value: 'item_with_auto_product', label: 'Items (auto product)', hint: 'Creates items; auto-creates a product per item when enabled.' },
];

export interface CatalogImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (result: CatalogImportResponse) => void;
}

export function CatalogImportDialog({ open, onOpenChange, onSuccess }: CatalogImportDialogProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const [mode, setMode] = React.useState<CatalogImportMode>('product_only');
    const [jsonText, setJsonText] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CatalogImportResponse | null>(null);

    const handleImport = async () => {
        setError(null);
        setResult(null);

        let rows: CatalogImportRow[];
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) {
                throw new Error('Expected a JSON array of objects.');
            }
            rows = parsed as CatalogImportRow[];
        } catch (e) {
            setError(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
            return;
        }

        rows = rows.map((r) => {
            const raw = (r.action ?? '').trim().toLowerCase();
            const action =
                raw === 'create' || raw === 'modify' || raw === 'delete'
                    ? raw
                    : 'create';
            return { ...r, action };
        });

        if (rows.length === 0) {
            setError('No rows to import.');
            return;
        }

        if (!accessToken) {
            setError('You are not authenticated.');
            return;
        }

        setLoading(true);
        try {
            const res = await catalogImportApi.import(accessToken, { mode, rows });
            setResult(res);
            onSuccess?.(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Import failed.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setJsonText('');
        setError(null);
        setResult(null);
        setMode('product_only');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Catalog Import</DialogTitle>
                    <DialogDescription>
                        Paste a JSON array of product/item rows and choose an import mode. Each row may set an
                        <code>action</code> of <code>create</code> / <code>modify</code> / <code>delete</code> (deactivate).
                        Default is CREATE. Delete rows only need <code>item_id</code>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="import-mode">Import mode</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as CatalogImportMode)}>
                            <SelectTrigger id="import-mode" className="w-full">
                                <SelectValue placeholder="Select a mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {MODE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {MODE_OPTIONS.find((o) => o.value === mode)?.hint}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="import-rows">Rows (JSON array)</Label>
                        <Textarea
                            id="import-rows"
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='[{"name": "Widget", "sku": "WDG-001", "uom": "pcs", "action": "create"}, {"action": "delete", "item_id": "<uuid>"}]'
                            className="min-h-40 font-mono text-xs"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="grid gap-2 rounded-md border p-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge variant="success">{result.created} created</Badge>
                                <Badge variant="secondary">{result.updated} updated</Badge>
                                {result.errors.length > 0 && (
                                    <Badge variant="destructive">{result.errors.length} errors</Badge>
                                )}
                            </div>
                            {result.errors.length > 0 && (
                                <ul className="max-h-32 overflow-auto text-xs">
                                    {result.errors.map((err, i) => (
                                        <li key={i} className="text-destructive">
                                            Row {err.row}: {err.error}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Close
                    </Button>
                    <Button type="button" onClick={handleImport} disabled={loading || !jsonText.trim()}>
                        {loading ? 'Importing…' : 'Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
