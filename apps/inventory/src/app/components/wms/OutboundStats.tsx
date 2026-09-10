import * as React from 'react';

import { CheckCircle2, ClipboardList, Clock, FileText, Loader, PackageCheck, Truck } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { cn } from '@horizon-sync/ui/lib';

import { useOutboundOrders, usePackingSlips, usePickLists } from '../../hooks/useWMS';
import { formatQuantity } from '../../utility';

interface OutboundStatsProps {
    warehouseId?: string;
    /**
     * Active outbound sub-tab. Stats switch for 'orders', 'pick' and 'packing';
     * any other tab (gate/dispatch/exceptions) keeps showing the previous stats.
     */
    activeTab: string;
    /** Increment to force the active tab's counts to refetch (e.g. after import/generation). */
    refreshKey?: number;
}

interface StatDef {
    key: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
}

const STAT_COLORS = [
    { bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/20', fg: 'text-yellow-600 dark:text-yellow-400' },
    { bg: 'bg-blue-100 dark:bg-blue-900/20', fg: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-violet-100 dark:bg-violet-900/20', fg: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/20', fg: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-red-100 dark:bg-red-900/20', fg: 'text-red-600 dark:text-red-400' },
] as const;

const ORDER_STATS: StatDef[] = [
    { key: 'total', title: 'Total Orders', icon: ClipboardList },
    { key: 'draft', title: 'Draft', icon: FileText },
    { key: 'confirmed', title: 'Confirmed', icon: CheckCircle2 },
    { key: 'pending_picking', title: 'Pending Picking', icon: Clock },
];

const PICK_STATS: StatDef[] = [
    { key: 'total', title: 'Total Pick Lists', icon: ClipboardList },
    { key: 'pending_picking', title: 'Pending Picking', icon: Clock },
    { key: 'in_progress', title: 'In Progress', icon: Loader },
    { key: 'pick_complete', title: 'Pick Complete', icon: PackageCheck },
];

const PACKING_STATS: StatDef[] = [
    { key: 'total', title: 'Total Packing Slips', icon: ClipboardList },
    { key: 'draft', title: 'Draft', icon: FileText },
    { key: 'loading', title: 'Loading', icon: Loader },
    { key: 'dispatched', title: 'Dispatched', icon: Truck },
];

const STAT_TABS = ['orders', 'pick', 'packing'] as const;
type StatsTab = (typeof STAT_TABS)[number];

const STATS_BY_TAB: Record<StatsTab, StatDef[]> = {
    orders: ORDER_STATS,
    pick: PICK_STATS,
    packing: PACKING_STATS,
};

function StatCard({
    stat,
    counts,
    colorIndex,
    loading,
    error,
}: {
    stat: StatDef;
    counts: Record<string, number> | null;
    colorIndex: number;
    loading: boolean;
    error: boolean;
}) {
    const Icon = stat.icon;
    const colors = STAT_COLORS[colorIndex] || STAT_COLORS[0];

    return (
        <Card className="border-border">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        {loading && !counts ? (
                            <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
                        ) : (
                            <p className="text-3xl font-bold tracking-tight">
                                {error && !counts ? '—' : formatQuantity(counts?.[stat.key] ?? 0)}
                            </p>
                        )}
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colors.bg)}>
                        <Icon className={cn('h-6 w-6', colors.fg)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function OutboundStats({ warehouseId, activeTab, refreshKey }: OutboundStatsProps) {
    // Remember the last stats tab so gate/dispatch/exceptions keep showing the
    // previous stats rather than clearing.
    const [statsTab, setStatsTab] = React.useState<StatsTab>('orders');

    React.useEffect(() => {
        if (STAT_TABS.includes(activeTab as StatsTab)) {
            setStatsTab(activeTab as StatsTab);
        }
    }, [activeTab]);

    // Only the active tab's counts are fetched — inactive tabs stay idle.
    const orders = useOutboundOrders({
        warehouse_id: warehouseId,
        page: 1,
        page_size: 1,
        enabled: statsTab === 'orders',
        refreshKey,
    });
    const picks = usePickLists({
        warehouse_id: warehouseId,
        page: 1,
        page_size: 1,
        enabled: statsTab === 'pick',
        refreshKey,
    });
    const packing = usePackingSlips({
        warehouse_id: warehouseId,
        page: 1,
        page_size: 1,
        enabled: statsTab === 'packing',
        refreshKey,
    });

    const stats = STATS_BY_TAB[statsTab];
    const active =
        statsTab === 'orders' ? orders : statsTab === 'pick' ? picks : packing;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
                <StatCard
                    key={stat.key}
                    stat={stat}
                    counts={active.statusCounts as unknown as Record<string, number> | null}
                    loading={active.loading}
                    error={!!active.error}
                    colorIndex={i}
                />
            ))}
        </div>
    );
}
