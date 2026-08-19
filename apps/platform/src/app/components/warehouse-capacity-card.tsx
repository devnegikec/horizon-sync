/**
 * WarehouseCapacityCard — modern warehouse capacity utilisation widget.
 *
 * Fetches the capacity tree for a single warehouse and renders volume/weight
 * utilisation with a status badge. Designed to sit on the main dashboard.
 */

'use client';

import * as React from 'react';

import { Boxes, Gauge, Warehouse, Weight } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';
import { cn } from '@horizon-sync/ui/lib';

import { environment } from '../../environments/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

type BinState = 'empty' | 'available' | 'almost_full' | 'full';

interface VolumeCapacity {
    occupied_m3: number | string;
    capacity_m3: number | string | null;
    pct: number | string | null;
}

interface WeightCapacity {
    occupied_kg: number | string;
    capacity_kg: number | string | null;
    pct: number | string | null;
}

interface CapacityTreeNode {
    node: string;
    level: string;
    code: string;
    full_path: string | null;
    volume: VolumeCapacity;
    weight: WeightCapacity;
    binding_pct: number | string | null;
    bin_state: BinState | null;
    is_available: boolean | null;
    children: CapacityTreeNode[];
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(value: unknown): number | null {
    if (value == null) return null;
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}

function fmt(value: unknown, digits: number): string {
    const n = toNumber(value);
    return n == null ? '—' : n.toFixed(digits);
}

function stateForPct(pct: number | null): { label: string; variant: BadgeVariant; color: string } {
    if (pct == null || pct <= 0) return { label: 'Empty', variant: 'secondary', color: '#9E9E9E' };
    if (pct >= 90) return { label: 'Full', variant: 'destructive', color: '#F44336' };
    if (pct >= 70) return { label: 'Almost Full', variant: 'warning', color: '#FFC107' };
    return { label: 'Available', variant: 'success', color: '#4CAF50' };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WarehouseCapacityCardProps {
    warehouseId: string;
    warehouseName?: string;
}

export function WarehouseCapacityCard({ warehouseId, warehouseName }: WarehouseCapacityCardProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const { toast } = useToast();
    const [data, setData] = React.useState<CapacityTreeNode | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!accessToken || !warehouseId) return;
        let cancelled = false;
        setLoading(true);
        fetch(`${environment.apiCoreUrl}/api/v1/capacity/warehouses/${warehouseId}/tree`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
            .then((result: CapacityTreeNode) => {
                if (!cancelled) setData(result);
            })
            .catch(() => {
                if (!cancelled) setData(null);
                if (!cancelled) {
                    toast({
                        title: 'Error',
                        description: 'Failed to load warehouse capacity',
                        variant: 'destructive',
                    });
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken, warehouseId, toast]);

    const binding = toNumber(data?.binding_pct) ?? 0;
    const state = stateForPct(binding);
    const volPct = toNumber(data?.volume?.pct);
    const wtPct = toNumber(data?.weight?.pct);
    const hasWeight = toNumber(data?.weight?.capacity_kg) != null;
    const volumePct = Math.max(0, Math.min(100, volPct ?? 0));
    const weightPct = Math.max(0, Math.min(100, wtPct ?? 0));

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/20">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                        <Warehouse className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold leading-tight">Warehouse Capacity</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{warehouseName || '—'}</p>
                    </div>
                </div>
                {!loading && data && <Badge variant={state.variant}>{state.label}</Badge>}
            </div>

            {/* Content */}
            {loading && !data ? (
                <div className="space-y-3">
                    <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
                </div>
            ) : !data ? (
                <p className="text-sm text-muted-foreground">No capacity data available.</p>
            ) : (
                <>
                    {/* Volume */}
                    <div className="space-y-2">
                        <div className="flex items-end justify-between">
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Boxes className="h-4 w-4" /> Volume
                            </span>
                            <div className="text-right">
                                <p className="text-xl font-bold leading-none">{volPct != null ? `${volPct.toFixed(1)}%` : '—'}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {fmt(data.volume?.occupied_m3, 2)} / {fmt(data.volume?.capacity_m3, 2)} m³
                                </p>
                            </div>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${volumePct}%` }}
                            />
                        </div>
                    </div>

                    {/* Weight */}
                    {hasWeight && (
                        <div className="space-y-2 mt-4">
                            <div className="flex items-end justify-between">
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Weight className="h-4 w-4" /> Weight
                                </span>
                                <div className="text-right">
                                    <p className="text-xl font-bold leading-none">{wtPct != null ? `${wtPct.toFixed(1)}%` : '—'}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        {fmt(data.weight?.occupied_kg, 1)} / {fmt(data.weight?.capacity_kg, 1)} kg
                                    </p>
                                </div>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                                    style={{ width: `${weightPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5" /> Overall utilisation
                        </span>
                        <span className={cn('text-xs font-semibold')} style={{ color: state.color }}>
                            {binding.toFixed(1)}% · {state.label.toLowerCase()}
                        </span>
                    </div>
                </>
            )}

            {/* Accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
    );
}
