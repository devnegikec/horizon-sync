import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import {
    AlertTriangle,
    Boxes,
    Download,
    FileText,
    Loader2,
    PackageCheck,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Warehouse,
} from 'lucide-react';

import {
    Button,
    Card,
    CardContent,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { useUserStore } from '@horizon-sync/store';
import { cn } from '@horizon-sync/ui/lib';

import { environment } from '../../../environments/environment';
import type {
    BinCapacityResponse,
    InventoryAgingResponse,
    ReceivingVarianceResponse,
    ReportPagination,
    StockMovementsResponse,
    WmsReportType,
} from '../../types/wms-report.types';

const API_REPORTS_BASE = `${environment.apiCoreUrl}/api/v1/wms/reports`;

const REPORT_TYPES: { value: WmsReportType; label: string }[] = [
    { value: 'stock-movements', label: 'Stock Movements' },
    { value: 'inventory-aging', label: 'Inventory Aging' },
    { value: 'receiving-variance', label: 'Receiving Variance' },
    { value: 'bin-capacity', label: 'Bin Capacity' },
];

interface WarehouseOption {
    id: string;
    name: string;
    code: string;
}

interface StatCardConfig {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
}

type ReportRow = Record<string, unknown>;

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardConfig) {
    return (
        <Card className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
                        <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/** Coerce a backend value (number or serialized string) to a number. */
function toNumber(value: unknown): number | null {
    if (value == null) return null;
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}

function fmtInt(value: unknown): string {
    const n = toNumber(value);
    return n == null ? '—' : Math.round(n).toLocaleString();
}

function fmtDecimal(value: unknown, digits = 2): string {
    const n = toNumber(value);
    return n == null ? '—' : n.toFixed(digits);
}

function fmtDate(value: unknown): string {
    if (value == null || value === '') return '—';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtPct(value: unknown): string {
    const n = toNumber(value);
    return n == null ? '—' : `${n.toFixed(1)}%`;
}

/** Local start-of-day ISO timestamp for a `YYYY-MM-DD` date input value. */
function startOfDayIso(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString();
}

/** Local end-of-day ISO timestamp so the whole selected day is included in the range. */
function endOfDayIso(value: string): string {
    return new Date(`${value}T23:59:59.999`).toISOString();
}

function movementTypeBadge(type: unknown) {
    const label = String(type ?? '—').toUpperCase();
    const variant =
        type === 'in'
            ? 'success'
            : type === 'out'
                ? 'default'
                : type === 'transfer'
                    ? 'secondary'
                    : 'outline';
    return <Badge variant={variant}>{label}</Badge>;
}

// ─── Summary cards per report type ────────────────────────────────────────────

function summaryCards(reportType: WmsReportType, summary: ReportRow | null): StatCardConfig[] {
    if (!summary) return [];

    switch (reportType) {
        case 'stock-movements': {
            const data = summary as unknown as StockMovementsResponse['summary'];
            return [
                { title: 'Inbound Qty', value: fmtInt(data.total_in_qty), icon: TrendingUp, iconBg: 'bg-emerald-100 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { title: 'Outbound Qty', value: fmtInt(data.total_out_qty), icon: TrendingDown, iconBg: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                { title: 'Transfers', value: fmtInt(data.total_transfer_qty), icon: RefreshCw, iconBg: 'bg-violet-100 dark:bg-violet-900/20', iconColor: 'text-violet-600 dark:text-violet-400' },
                { title: 'Adjustments', value: fmtInt(data.total_adjustment_qty), icon: AlertTriangle, iconBg: 'bg-amber-100 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
            ];
        }
        case 'inventory-aging': {
            const data = summary as unknown as InventoryAgingResponse['summary'];
            return [
                { title: 'Idle Items', value: fmtInt(data.idle_item_count), icon: Boxes, iconBg: 'bg-amber-100 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
                { title: 'Idle Quantity', value: fmtInt(data.total_idle_qty), icon: PackageCheck, iconBg: 'bg-violet-100 dark:bg-violet-900/20', iconColor: 'text-violet-600 dark:text-violet-400' },
                { title: 'Idle Value', value: fmtDecimal(data.total_idle_value), icon: FileText, iconBg: 'bg-emerald-100 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { title: 'Idle Threshold', value: `${fmtInt(data.days_idle)} days`, icon: RefreshCw, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
            ];
        }
        case 'receiving-variance': {
            const data = summary as unknown as ReceivingVarianceResponse['summary'];
            return [
                { title: 'Expected Qty', value: fmtInt(data.total_expected_qty), icon: FileText, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
                { title: 'Received Qty', value: fmtInt(data.total_received_qty), icon: PackageCheck, iconBg: 'bg-emerald-100 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { title: 'Variance', value: fmtInt(data.total_variance_qty), icon: AlertTriangle, iconBg: 'bg-amber-100 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
                { title: 'Lines (Short / Excess)', value: `${fmtInt(data.short_line_count)} / ${fmtInt(data.excess_line_count)}`, icon: TrendingDown, iconBg: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
            ];
        }
        case 'bin-capacity': {
            const data = summary as unknown as BinCapacityResponse['summary'];
            return [
                { title: 'Total Bins', value: fmtInt(data.total_bins), icon: Warehouse, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
                { title: 'Occupied / Capacity (cc)', value: `${fmtInt(data.total_occupied_cc)} / ${fmtInt(data.total_capacity_cc)}`, icon: Boxes, iconBg: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
                { title: 'Volume Utilisation', value: fmtPct(data.volume_utilization_pct), icon: TrendingUp, iconBg: 'bg-violet-100 dark:bg-violet-900/20', iconColor: 'text-violet-600 dark:text-violet-400' },
                { title: 'Over / Full Bins', value: `${fmtInt(data.over_utilized_bins)} / ${fmtInt(data.full_bins)}`, icon: AlertTriangle, iconBg: 'bg-amber-100 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400' },
            ];
        }
    }
}

// ─── Columns per report type ─────────────────────────────────────────────────

function getColumns(reportType: WmsReportType): ColumnDef<ReportRow, unknown>[] {
    switch (reportType) {
        case 'stock-movements':
            return [
                { accessorKey: 'performed_at', header: 'Date', cell: ({ row }) => fmtDate(row.original.performed_at) },
                { accessorKey: 'movement_type', header: 'Type', cell: ({ row }) => movementTypeBadge(row.original.movement_type) },
                { accessorKey: 'item_code', header: 'Item Code' },
                { accessorKey: 'item_name', header: 'Item Name' },
                { accessorKey: 'sku', header: 'SKU' },
                { accessorKey: 'warehouse_name', header: 'Warehouse' },
                { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => fmtInt(row.original.quantity) },
                { accessorKey: 'line_value', header: 'Line Value', cell: ({ row }) => fmtDecimal(row.original.line_value) },
                { accessorKey: 'reference_type', header: 'Reference' },
            ];
        case 'inventory-aging':
            return [
                { accessorKey: 'item_code', header: 'Item Code' },
                { accessorKey: 'item_name', header: 'Item Name' },
                { accessorKey: 'sku', header: 'SKU' },
                { accessorKey: 'warehouse_name', header: 'Warehouse' },
                { accessorKey: 'quantity_on_hand', header: 'On Hand', cell: ({ row }) => fmtInt(row.original.quantity_on_hand) },
                { accessorKey: 'quantity_reserved', header: 'Reserved', cell: ({ row }) => fmtInt(row.original.quantity_reserved) },
                { accessorKey: 'quantity_available', header: 'Available', cell: ({ row }) => fmtInt(row.original.quantity_available) },
                { accessorKey: 'last_moved_at', header: 'Last Moved', cell: ({ row }) => fmtDate(row.original.last_moved_at) },
                { accessorKey: 'est_value', header: 'Est. Value', cell: ({ row }) => fmtDecimal(row.original.est_value) },
                { accessorKey: 'days_idle', header: 'Days Idle', cell: ({ row }) => fmtInt(row.original.days_idle) },
            ];
        case 'receiving-variance':
            return [
                { accessorKey: 'asn_order_no', header: 'ASN No' },
                { accessorKey: 'order_date', header: 'Order Date', cell: ({ row }) => fmtDate(row.original.order_date) },
                { accessorKey: 'asn_status', header: 'ASN Status' },
                { accessorKey: 'warehouse_name', header: 'Warehouse' },
                { accessorKey: 'item_code', header: 'Item Code' },
                { accessorKey: 'item_name', header: 'Item Name' },
                { accessorKey: 'sku', header: 'SKU' },
                { accessorKey: 'expected_qty', header: 'Expected', cell: ({ row }) => fmtInt(row.original.expected_qty) },
                { accessorKey: 'received_qty', header: 'Received', cell: ({ row }) => fmtInt(row.original.received_qty) },
                {
                    accessorKey: 'variance_qty',
                    header: 'Variance',
                    cell: ({ row }) => {
                        const variance = toNumber(row.original.variance_qty) ?? 0;
                        if (variance === 0) return <Badge variant="secondary">Matched</Badge>;
                        return (
                            <Badge variant={variance > 0 ? 'warning' : 'success'}>
                                {variance > 0 ? `Short ${fmtInt(variance)}` : `Excess ${fmtInt(Math.abs(variance))}`}
                            </Badge>
                        );
                    },
                },
            ];
        case 'bin-capacity':
            return [
                { accessorKey: 'code', header: 'Code' },
                { accessorKey: 'full_path', header: 'Location' },
                { accessorKey: 'location_type', header: 'Type' },
                {
                    accessorKey: 'is_pickable',
                    header: 'Pickable',
                    cell: ({ row }) => (row.original.is_pickable ? <Badge variant="success">Yes</Badge> : <Badge variant="secondary">No</Badge>),
                },
                { accessorKey: 'unit_count', header: 'Units', cell: ({ row }) => fmtInt(row.original.unit_count) },
                { accessorKey: 'master_pack_count', header: 'Master Packs', cell: ({ row }) => fmtInt(row.original.master_pack_count) },
                { accessorKey: 'occupied_cc', header: 'Occupied (cc)', cell: ({ row }) => fmtInt(row.original.occupied_cc) },
                { accessorKey: 'capacity_cc', header: 'Capacity (cc)', cell: ({ row }) => fmtInt(row.original.capacity_cc) },
                { accessorKey: 'volume_utilization_pct', header: 'Volume %', cell: ({ row }) => fmtPct(row.original.volume_utilization_pct) },
            ];
    }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WMSReports() {
    const accessToken = useUserStore((s) => s.accessToken);

    const [reportType, setReportType] = React.useState<WmsReportType>('stock-movements');
    const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);
    const [warehouseId, setWarehouseId] = React.useState('all');
    const [movementType, setMovementType] = React.useState('all');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [daysIdle, setDaysIdle] = React.useState('30');

    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [summary, setSummary] = React.useState<ReportRow | null>(null);
    const [rows, setRows] = React.useState<ReportRow[]>([]);
    const [pagination, setPagination] = React.useState<ReportPagination | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [reloadKey, setReloadKey] = React.useState(0);
    const [exporting, setExporting] = React.useState(false);

    // Load the user's accessible warehouses once for the filter.
    React.useEffect(() => {
        if (!accessToken) return;
        fetch(`${environment.apiCoreUrl}/api/v1/warehouse-users/my-warehouses`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
            .then((data) => setWarehouses(data.warehouses || []))
            .catch(() => setWarehouses([]));
    }, [accessToken]);

    const buildQuery = React.useCallback(() => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('page_size', String(pageSize));
        if (warehouseId !== 'all') params.set('warehouse_id', warehouseId);

        if (reportType === 'stock-movements') {
            if (movementType !== 'all') params.set('movement_type', movementType);
            if (dateFrom) params.set('date_from', startOfDayIso(dateFrom));
            if (dateTo) params.set('date_to', endOfDayIso(dateTo));
        } else if (reportType === 'inventory-aging') {
            params.set('days_idle', daysIdle || '30');
        } else if (reportType === 'receiving-variance') {
            if (dateFrom) params.set('date_from', startOfDayIso(dateFrom));
            if (dateTo) params.set('date_to', endOfDayIso(dateTo));
        }

        return params;
    }, [reportType, page, pageSize, warehouseId, movementType, dateFrom, dateTo, daysIdle]);

    const fetchReport = React.useCallback(() => {
        if (!accessToken) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(`${API_REPORTS_BASE}/${reportType}?${buildQuery()}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then((data: { summary?: ReportRow | null; rows?: ReportRow[]; pagination?: ReportPagination | null }) => {
                if (cancelled) return;
                setSummary(data.summary ?? null);
                setRows(data.rows ?? []);
                setPagination(data.pagination ?? null);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Failed to load report');
                setSummary(null);
                setRows([]);
                setPagination(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [accessToken, reportType, buildQuery]);

    React.useEffect(() => fetchReport(), [fetchReport, reloadKey]);

    const handleExport = React.useCallback(async () => {
        if (!accessToken) return;
        setExporting(true);
        try {
            const params = buildQuery();
            params.set('format', 'csv');
            const res = await fetch(`${API_REPORTS_BASE}/${reportType}?${params}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error(`Export failed (${res.status})`);
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition');
            const match = disposition && /filename="?([^";]+)"?/.exec(disposition);
            const filename = match?.[1] ?? `${reportType}.csv`;
            const href = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(href);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export report');
        } finally {
            setExporting(false);
        }
    }, [accessToken, reportType, buildQuery]);

    const selectReportType = (value: WmsReportType) => {
        setReportType(value);
        setPage(1);
        setMovementType('all');
        setDateFrom('');
        setDateTo('');
        // Drop the previous report's payload so the new columns/KPI cards never
        // render against rows that belong to a different report type.
        setSummary(null);
        setRows([]);
        setPagination(null);
    };

    const columns = React.useMemo(() => getColumns(reportType), [reportType]);
    const cards = summaryCards(reportType, summary);
    const hasActiveFilters =
        warehouseId !== 'all' ||
        (reportType === 'stock-movements' && (movementType !== 'all' || !!dateFrom || !!dateTo)) ||
        (reportType === 'inventory-aging' && daysIdle !== '30') ||
        (reportType === 'receiving-variance' && (!!dateFrom || !!dateTo));

    const serverPaginationConfig = React.useMemo(() => {
        if (!pagination) return undefined;
        return {
            totalItems: pagination.total_items ?? 0,
            currentPage: page,
            pageSize,
            onPageChange: (nextPage: number, nextPageSize: number) => {
                setPageSize(nextPageSize);
                // A bigger page size shrinks the page count, so keep the current
                // page in range instead of requesting a page that no longer exists.
                setPage(nextPageSize === pageSize ? nextPage : 1);
            },
        };
    }, [pagination, page, pageSize]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">WMS Reports</h2>
                    <p className="text-muted-foreground mt-1">
                        Stock movements, inventory aging, receiving variance and bin capacity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Report type selector */}
            <div className="border rounded-lg overflow-hidden">
                <div className="flex border-b overflow-x-auto">
                    {REPORT_TYPES.map((type) => (
                        <button
                            key={type.value}
                            className={cn(
                                'px-4 py-2 text-sm font-medium whitespace-nowrap',
                                reportType === type.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/50 hover:bg-muted'
                            )}
                            onClick={() => selectReportType(type.value)}>
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats grid */}
            {cards.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <StatCard key={card.title} {...card} />
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                    <Label htmlFor="wms-report-warehouse">Warehouse</Label>
                    <Select value={warehouseId} onValueChange={(value) => { setWarehouseId(value); setPage(1); }}>
                        <SelectTrigger id="wms-report-warehouse" className="w-[200px]">
                            <SelectValue placeholder="All Warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Warehouses</SelectItem>
                            {warehouses.map((wh) => (
                                <SelectItem key={wh.id} value={wh.id}>
                                    {wh.name} ({wh.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {reportType === 'stock-movements' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="wms-report-movement-type">Movement Type</Label>
                            <Select value={movementType} onValueChange={(value) => { setMovementType(value); setPage(1); }}>
                                <SelectTrigger id="wms-report-movement-type" className="w-[160px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="in">In</SelectItem>
                                    <SelectItem value="out">Out</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wms-report-date-from">From</Label>
                            <Input id="wms-report-date-from" type="date" className="w-[170px]" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wms-report-date-to">To</Label>
                            <Input id="wms-report-date-to" type="date" className="w-[170px]" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                        </div>
                    </>
                )}

                {reportType === 'inventory-aging' && (
                    <div className="space-y-2">
                        <Label htmlFor="wms-report-days-idle">Days Idle</Label>
                        <Input
                            id="wms-report-days-idle"
                            type="number"
                            min={0}
                            className="w-[140px]"
                            value={daysIdle}
                            onChange={(e) => { setDaysIdle(e.target.value); setPage(1); }} />
                    </div>
                )}

                {reportType === 'receiving-variance' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="wms-report-var-from">From</Label>
                            <Input id="wms-report-var-from" type="date" className="w-[170px]" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wms-report-var-to">To</Label>
                            <Input id="wms-report-var-to" type="date" className="w-[170px]" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                        </div>
                    </>
                )}
            </div>

            {/* Table */}
            {error && (
                <Card>
                    <CardContent className="p-0">
                        <div className="p-4 text-destructive text-sm border-b">{error}</div>
                    </CardContent>
                </Card>
            )}

            {loading && rows.length === 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <TableSkeleton columns={6} rows={8} showHeader={true} />
                    </CardContent>
                </Card>
            ) : rows.length === 0 && !error ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="p-6">
                            <EmptyState
                                icon={<FileText className="h-12 w-12" />}
                                title="No report data found"
                                description={hasActiveFilters ? 'Try adjusting your filters' : 'No records for the selected report'}
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={rows}
                            config={{
                                showSerialNumber: true,
                                showPagination: true,
                                enableRowSelection: false,
                                enableColumnVisibility: true,
                                enableSorting: true,
                                enableFiltering: false,
                                initialPageSize: pageSize,
                                serverPagination: serverPaginationConfig,
                            }}
                            fixedHeader
                            maxHeight="auto" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
