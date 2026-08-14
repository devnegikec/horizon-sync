import * as React from 'react';

import { Boxes, Warehouse, Weight } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { capacityApi } from '../../utility/api/wms';
import type { BinState, CapacityTreeNode } from '../../types/wms.types';

interface WarehouseCapacityCardProps {
    warehouseId: string;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const STATE_META: Record<BinState, { label: string; variant: BadgeVariant; color: string }> = {
    empty: { label: 'Empty', variant: 'secondary', color: '#9E9E9E' },
    available: { label: 'Available', variant: 'default', color: '#4CAF50' },
    almost_full: { label: 'Almost Full', variant: 'outline', color: '#FFC107' },
    full: { label: 'Full', variant: 'destructive', color: '#F44336' },
};

/** Warehouse-level status derived from utilisation (matches backend 70/90 defaults). */
function stateForPct(pct: number | null): BinState {
    if (pct == null || pct <= 0) return 'empty';
    if (pct >= 90) return 'full';
    if (pct >= 70) return 'almost_full';
    return 'available';
}

function ProgressBar({ pct, color }: { pct: number | null; color: string }) {
    const value = Math.max(0, Math.min(100, pct ?? 0));
    return (
        <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
    );
}

export function WarehouseCapacityCard({ warehouseId }: WarehouseCapacityCardProps) {
    const accessToken = useUserStore((s) => s.accessToken);
    const { toast } = useToast();
    const [data, setData] = React.useState<CapacityTreeNode | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!accessToken || !warehouseId) return;
        let cancelled = false;
        setLoading(true);
        capacityApi
            .getTree(accessToken, warehouseId)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err: unknown) => {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Failed to load capacity',
                    variant: 'destructive',
                });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken, warehouseId, toast]);

    const binding = data?.binding_pct ?? 0;
    const state = stateForPct(binding);
    const meta = STATE_META[state];
    const volPct = data?.volume?.pct ?? null;
    const wtPct = data?.weight?.pct ?? null;
    const hasWeight = data != null && data.weight.capacity_kg != null;

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Warehouse Capacity</CardTitle>
                    </div>
                    {!loading && data && <Badge variant={meta.variant}>{meta.label}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading && !data ? (
                    <div className="space-y-3">
                        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                        <div className="h-2 w-2/3 rounded-full bg-muted animate-pulse" />
                    </div>
                ) : !data ? (
                    <p className="text-sm text-muted-foreground">No capacity data available.</p>
                ) : (
                    <>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Boxes className="h-4 w-4" /> Volume
                                </span>
                                <span className="font-medium">
                                    {data.volume.occupied_m3.toFixed(3)} /{' '}
                                    {data.volume.capacity_m3 != null ? data.volume.capacity_m3.toFixed(3) : '—'} m³
                                    {volPct != null && <span className="ml-2 text-muted-foreground">{volPct.toFixed(1)}%</span>}
                                </span>
                            </div>
                            <ProgressBar pct={volPct} color="#3058EE" />
                        </div>

                        {hasWeight && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Weight className="h-4 w-4" /> Weight
                                    </span>
                                    <span className="font-medium">
                                        {data.weight.occupied_kg.toFixed(2)} /{' '}
                                        {data.weight.capacity_kg != null ? data.weight.capacity_kg.toFixed(2) : '—'} kg
                                        {wtPct != null && <span className="ml-2 text-muted-foreground">{wtPct.toFixed(1)}%</span>}
                                    </span>
                                </div>
                                <ProgressBar pct={wtPct} color="#F59E0B" />
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Overall utilisation <span className="font-medium text-foreground">{binding.toFixed(1)}%</span> · status{' '}
                            <span style={{ color: meta.color }}>{meta.label.toLowerCase()}</span>
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
