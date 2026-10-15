import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { fetchCapacityTree, fetchMyWarehouses } from '../api';
import type { DashboardWidgetProps } from '../types';
import { useApiData } from '../useApiData';
import { toNumber } from '../utils';

/** Minimal structural type for the recursive capacity tree node. */
interface CapacityNodeLike {
  code: string;
  volume?: { occupied_m3?: number; capacity_m3?: number | null };
  children?: CapacityNodeLike[];
}

interface TreeItem {
  [key: string]: unknown;
  name: string;
  size: number;
  children?: TreeItem[];
}

/** Empty zones keep a sliver so they stay visible without implying occupancy. */
const EMPTY_ZONE_SIZE = 0.01;

/** Sum top-level zone occupied volume across every warehouse in scope. */
function collectZoneTotals(trees: CapacityNodeLike[]): TreeItem[] {
  const totals = new Map<string, number>();
  trees.forEach((tree) => {
    (tree.children ?? []).forEach((zone) => {
      const occupied = toNumber(zone.volume?.occupied_m3) ?? 0;
      totals.set(zone.code, (totals.get(zone.code) ?? 0) + occupied);
    });
  });
  return [...totals.entries()].map(([name, size]) => ({ name, size: size > 0 ? size : EMPTY_ZONE_SIZE }));
}

/** Occupied volume per top-level zone from `capacity/warehouses/{id}/tree` — widget #7. */
export function ZoneUtilizationWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const scope = filters.warehouseId ?? 'all';
  const { data, loading, error } = useApiData(
    `zone-utilization:${scope}`,
    async (token) => {
      const warehouses = await fetchMyWarehouses(token);
      const targets = filters.warehouseId
        ? warehouses.filter((warehouse) => warehouse.id === filters.warehouseId)
        : warehouses;
      if (targets.length === 0) return null;
      const trees = await Promise.all(targets.map((warehouse) => fetchCapacityTree(token, warehouse.id)));
      return {
        scopeLabel: targets.length === 1 ? targets[0].name : `All warehouses (${targets.length})`,
        items: collectZoneTotals(trees),
      };
    },
    refreshToken,
  );

  if (loading && data === null) return <Skeleton className="h-[320px] w-full rounded-lg" />;
  if (error) return <p className="p-2 text-sm text-destructive">{error}</p>;
  if (!data || data.items.length === 0) {
    return <p className="p-2 text-sm text-muted-foreground">No warehouse capacity data.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Occupied volume by zone · {data.scopeLabel}</p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={data.items} dataKey="size" aspectRatio={4 / 3} stroke="#fff" fill="#8b5cf6">
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
