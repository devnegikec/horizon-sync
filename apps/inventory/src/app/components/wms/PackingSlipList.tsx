import * as React from 'react';

import { Eye, Loader2, PackageCheck, RefreshCw, Truck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { packingSlipApi } from '../../utility/api/wms';
import type {
    PackingSlipGroup,
    PackingSlipGroupItem,
    PackingSlip,
    PackingSlipItem,
    PaginatedPackingSlips,
} from '../../types/wms.types';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from './QRDetailDialog';
import { WMSStatusBadge } from './WMSStatusBadge';

function packingItemToChildRow(item: PackingSlipGroupItem, productName: string, index: number): QRDetailRow {
    return {
        id: `${item.serial_number}-${index}`,
        name: productName,
        sku: item.sku,
        batch: item.batch_number,
        serialNumber: item.serial_number,
        manufacturingDate: item.manufacturing_date ?? null,
        expiryDate: item.expiry_date ?? null,
        quantity: item.quantity,
    };
}

function packingGroupToRow(group: PackingSlipGroup, index: number): QRDetailRow {
    const items = Array.isArray(group.items) ? group.items : [];
    const first = items[0];
    return {
        id: group.parent_qseal?.id ?? `packing-group-${index}`,
        name: group.product_name,
        sku: first?.sku ?? null,
        batch: first?.batch_number ?? null,
        serialNumber: group.parent_qseal?.serial_number ?? null,
        quantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        meta: { bin: group.bin_location_id },
        children: items.map((item, itemIndex) => packingItemToChildRow(item, group.product_name, itemIndex)),
    };
}

function packingItemToRow(item: PackingSlipItem): QRDetailRow {
    return {
        id: item.id,
        name: item.item_name ?? item.sku ?? item.item_id,
        sku: item.sku ?? item.item_id,
        batch: item.batch_no,
        quantity: item.qty,
        meta: { bin: item.bin_location_id, uom: item.uom },
    };
}

function packingSlipToRows(slip: PackingSlip): QRDetailRow[] {
    if (Array.isArray(slip.groups) && slip.groups.length > 0) {
        return slip.groups.map(packingGroupToRow);
    }
    return (Array.isArray(slip.items) ? slip.items : []).map(packingItemToRow);
}

function packingSlipItemCount(slip: PackingSlip): number {
    if (Array.isArray(slip.groups) && slip.groups.length > 0) {
        return slip.groups.reduce(
            (sum, group) => sum + (Array.isArray(group.items) ? group.items.reduce((groupSum, item) => groupSum + (item.quantity || 0), 0) : 0),
            0,
        );
    }
    return (Array.isArray(slip.items) ? slip.items : []).reduce((sum, item) => sum + (item.qty || 0), 0);
}

export function PackingSlipList({ warehouseId }: { warehouseId?: string }) {
    const accessToken = useUserStore((s) => s.accessToken);
    const { toast } = useToast();
    const [page, setPage] = React.useState(1);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [data, setData] = React.useState<PaginatedPackingSlips | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [viewSlip, setViewSlip] = React.useState<PackingSlip | null>(null);
    const [viewLoading, setViewLoading] = React.useState(false);
    const [busyId, setBusyId] = React.useState<string | null>(null);
    const fetchRequestId = React.useRef(0);
    const detailRequestId = React.useRef(0);

    const fetch = React.useCallback(async () => {
        if (!accessToken) return;
        const requestId = ++fetchRequestId.current;
        setLoading(true);
        setError(null);
        try {
            const result = await packingSlipApi.list(accessToken, {
                warehouse_id: warehouseId,
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                page_size: 20,
            });
            if (requestId !== fetchRequestId.current) return;
            setData(result);
        } catch (err) {
            if (requestId !== fetchRequestId.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load packing slips');
        } finally {
            if (requestId === fetchRequestId.current) {
                setLoading(false);
            }
        }
    }, [accessToken, warehouseId, statusFilter, page]);

    React.useEffect(() => {
        fetch();
    }, [fetch]);

    const openDetail = async (id: string) => {
        if (!accessToken) return;
        const requestId = ++detailRequestId.current;
        setViewLoading(true);
        try {
            const slip = await packingSlipApi.get(accessToken, id);
            if (requestId !== detailRequestId.current) return;
            setViewSlip(slip);
        } catch (err) {
            if (requestId !== detailRequestId.current) return;
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to load packing slip',
                variant: 'destructive',
            });
        } finally {
            if (requestId === detailRequestId.current) {
                setViewLoading(false);
            }
        }
    };

    const markLoading = async (id: string) => {
        if (!accessToken) return;
        setBusyId(id);
        try {
            await packingSlipApi.markLoading(accessToken, id);
            toast({ title: 'Packing slip moved to loading' });
            fetch();
            setViewSlip(null);
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed',
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    const dispatch = async (id: string) => {
        if (!accessToken) return;
        setBusyId(id);
        try {
            await packingSlipApi.dispatch(accessToken, id);
            toast({ title: 'Packing slip dispatched' });
            fetch();
            setViewSlip(null);
        } catch (err) {
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to dispatch',
                variant: 'destructive',
            });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                        setStatusFilter(v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="loading">Loading</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetch} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </Button>
            </div>

            {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading packing slips...</div>}
            {error && <div className="text-sm text-destructive">{error}</div>}

            {!loading && data && (
                <>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Packing Slip #</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
                                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.packing_slips.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No packing slips found. Pack a completed order to create one.
                                        </td>
                                    </tr>
                                )}
                                {data.packing_slips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono font-medium">{slip.packing_slip_no}</td>
                                        <td className="px-4 py-3"><WMSStatusBadge status={slip.status} /></td>
                                        <td className="px-4 py-3 text-muted-foreground">{slip.order_ids.length}</td>
                                        <td className="px-4 py-3 text-right">{slip.item_count}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {slip.created_at ? new Date(slip.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="gap-1 h-7 px-2 text-xs"
                                                    onClick={() => openDetail(slip.id)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
                                                </Button>
                                                {slip.status === 'draft' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 h-7 px-2 text-xs"
                                                        disabled={busyId === slip.id}
                                                        onClick={() => markLoading(slip.id)}
                                                    >
                                                        {busyId === slip.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                                                        Mark Loading
                                                    </Button>
                                                )}
                                                {slip.status === 'loading' && (
                                                    <Button
                                                        size="sm"
                                                        className="gap-1 h-7 px-2 text-xs"
                                                        disabled={busyId === slip.id}
                                                        onClick={() => dispatch(slip.id)}
                                                    >
                                                        {busyId === slip.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                                                        Dispatch
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {data.pagination.total_pages > 1 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={!data.pagination.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                                <Button variant="outline" size="sm" disabled={!data.pagination.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <QRDetailDialog
                open={viewSlip !== null || viewLoading}
                onOpenChange={(o) => {
                    if (!o) setViewSlip(null);
                }}
                title={viewSlip ? `Packing — ${viewSlip.packing_slip_no}` : 'Loading...'}
                loading={viewLoading}
                loadingMessage="Loading packing slip..."
                rows={viewSlip ? packingSlipToRows(viewSlip) : []}
                columns={[
                    {
                        id: 'bin',
                        header: 'Bin',
                        cell: (row) => <span className="font-mono text-[11px]">{typeof row.meta?.bin === 'string' ? row.meta.bin.slice(0, 8) : '—'}</span>,
                    },
                    {
                        id: 'uom',
                        header: 'UOM',
                        align: 'right',
                        cell: (row) => <span className="text-xs text-muted-foreground">{typeof row.meta?.uom === 'string' ? row.meta.uom : '—'}</span>,
                    },
                ] satisfies QRDetailColumn[]}
                emptyMessage="No items"
                summary={viewSlip ? (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-lg border p-3">
                            <p className="mb-1 text-xs text-muted-foreground">Status</p>
                            <WMSStatusBadge status={viewSlip.status} />
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="mb-1 text-xs text-muted-foreground">Orders</p>
                            <p className="font-semibold">{viewSlip.order_ids.length}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="mb-1 text-xs text-muted-foreground">Items</p>
                            <p className="font-semibold">{packingSlipItemCount(viewSlip)}</p>
                        </div>
                    </div>
                ) : undefined}
            />
        </div>
    );
}
