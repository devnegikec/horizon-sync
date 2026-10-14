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

function toItem(node: CapacityNodeLike): TreeItem {
  const occupied = toNumber(node.volume?.occupied_m3) ?? 0;
  const capacity = toNumber(node.volume?.capacity_m3) ?? 0;
  const size = occupied > 0 ? occupied : capacity > 0 ? capacity : 1;
  const children = (node.children ?? []).map(toItem);
  return children.length > 0 ? { name: node.code, size, children } : { name: node.code, size };
}

/** Zone → aisle → bin rollup from `capacity/warehouses/{id}/tree` — widget #7. */
export function ZoneUtilizationWidget({ refreshToken }: DashboardWidgetProps) {
  const { data, loading, error } = useApiData(
    'zone-utilization',
    async (token) => {
      const warehouses = await fetchMyWarehouses(token);
      if (warehouses.length === 0) return null;
      const tree = await fetchCapacityTree(token, warehouses[0].id);
      return { warehouseName: warehouses[0].name, items: (tree.children ?? []).map(toItem) };
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
      <p className="text-xs text-muted-foreground">Occupied volume by zone · {data.warehouseName}</p>
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
