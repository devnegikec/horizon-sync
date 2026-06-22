import * as React from 'react';

import {
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Minus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import { useLocationTree } from '../../hooks/useWMS';
import type { LocationTree } from '../../types/wms.types';

import { LocationTypeBadge } from './WMSStatusBadge';

// ============================================
// DERIVED CAPACITY CALCULATION
// Walk the tree bottom-up: a node's derived capacity is the sum of its
// children's derived capacities. Leaf bins use their own total_capacity.
// ============================================

interface FlatRow extends LocationTree {
  derived_capacity: number;
  derived_available: number;
  subRows?: FlatRow[];
}

function computeDerived(node: LocationTree): FlatRow {
  // Coerce API values to numbers defensively — the backend may return strings
  const ownCapacity = Number(node.total_capacity) || 0;
  const ownAvailable = Number(node.available_capacity) || 0;

  if (!node.children || node.children.length === 0) {
    // Leaf node (bin) — use its own numeric values
    return {
      ...node,
      total_capacity: ownCapacity,
      available_capacity: ownAvailable,
      derived_capacity: ownCapacity,
      derived_available: ownAvailable,
      subRows: [],
    };
  }

  const enrichedChildren = node.children.map(computeDerived);
  const derived_capacity = enrichedChildren.reduce((sum, c) => sum + c.derived_capacity, 0);
  const derived_available = enrichedChildren.reduce((sum, c) => sum + c.derived_available, 0);

  return {
    ...node,
    total_capacity: ownCapacity,
    available_capacity: ownAvailable,
    derived_capacity,
    derived_available,
    subRows: enrichedChildren,
  };
}

// ============================================
// CAPACITY BAR
// ============================================

function CapacityBar({ total, available }: { total: number; available: number }) {
  const t = Number(total) || 0;
  const a = Number(available) || 0;
  if (t === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const used = t - a;
  const pct = Math.min(100, Math.round((used / t) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ============================================
// EXPAND BUTTON CELL
// ============================================

function ExpandCell({ row }: { row: Row<FlatRow> }) {
  const depth = row.depth;
  const canExpand = row.getCanExpand();

  return (
    <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
      {canExpand ? (
        <button onClick={row.getToggleExpandedHandler()}
          className="mr-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}>
          {row.getIsExpanded() ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <Minus className="h-3 w-3 mr-1.5 text-muted-foreground/40 shrink-0" />
      )}
      <LocationTypeBadge type={row.original.location_type} />
    </div>
  );
}

// ============================================
// COLUMNS
// ============================================

const columns: ColumnDef<FlatRow>[] = [
  {
    id: 'type',
    header: 'Type / Code',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <ExpandCell row={row} />
        <span className="font-mono text-sm font-medium">{row.original.code}</span>
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.name ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'full_path',
    header: 'Full Path',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.full_path ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'total_capacity',
    header: 'Own Capacity',
    cell: ({ row }) => {
      const cap = Number(row.original.total_capacity) || 0;
      const uom = row.original.capacity_uom ?? '';
      return (
        <span className="tabular-nums text-sm">
          {cap > 0 ? `${cap.toLocaleString()}${uom ? ` ${uom}` : ''}` : '—'}
        </span>
      );
    },
  },
  {
    id: 'derived_capacity',
    header: 'Derived Capacity',
    cell: ({ row }) => {
      const cap = Number(row.original.derived_capacity) || 0;
      const avail = Number(row.original.derived_available) || 0;
      const uom = row.original.capacity_uom ?? '';
      if (cap === 0) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <div className="space-y-1">
          <div className="text-sm tabular-nums font-medium">
            {cap.toLocaleString()}{uom ? ` ${uom}` : ''}
          </div>
          <CapacityBar total={cap} available={avail} />
        </div>
      );
    },
  },
  {
    id: 'available',
    header: 'Available',
    cell: ({ row }) => {
      const cap = Number(row.original.derived_capacity) || 0;
      const avail = Number(row.original.derived_available) || 0;
      const uom = row.original.capacity_uom ?? '';
      if (cap === 0) return <span className="text-muted-foreground text-sm">—</span>;
      const pct = Math.min(100, Math.round((avail / cap) * 100));
      return (
        <div className="text-sm tabular-nums">
          <span className={cn(pct < 10 ? 'text-red-600' : pct < 30 ? 'text-yellow-600' : 'text-green-600', 'font-medium')}>
            {avail.toLocaleString()}
          </span>
          {uom ? <span className="text-muted-foreground ml-1">{uom}</span> : null}
        </div>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        row.original.is_active
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      )}>
        {row.original.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

// ============================================
// HOVER TOOLTIP BUILDER
// ============================================

function buildRowTooltip(node: FlatRow): string {
  const lines: string[] = [];
  lines.push(`${node.location_type.toUpperCase()}: ${node.code}`);
  if (node.name) lines.push(`Name: ${node.name}`);
  if (node.full_path) lines.push(`Path: ${node.full_path}`);
  const cap = Number(node.derived_capacity) || 0;
  const avail = Number(node.derived_available) || 0;
  if (cap > 0) {
    const used = cap - avail;
    const pct = Math.round((used / cap) * 100);
    lines.push(`Capacity: ${used.toLocaleString()} / ${cap.toLocaleString()} (${pct}% used)`);
    lines.push(`Available: ${avail.toLocaleString()}`);
  }
  lines.push(`Status: ${node.is_active ? 'Active' : 'Inactive'}`);
  return lines.join('\n');
}

// ============================================
// MAIN COMPONENT
// ============================================

interface LocationTreeViewProps {
  warehouseId: string;
  onSelect?: (location: LocationTree) => void;
}

export function LocationTreeView({ warehouseId, onSelect }: LocationTreeViewProps) {
  const { tree, loading, error, refetch } = useLocationTree(warehouseId);

  // Enrich tree with derived capacity values
  const enrichedData = React.useMemo<FlatRow[]>(
    () => tree.map(computeDerived),
    [tree],
  );

  const table = useReactTable<FlatRow>({
    data: enrichedData,
    columns,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // Start with top-level rows expanded
    initialState: { expanded: true },
  });

  // Expand all on first load
  React.useEffect(() => {
    if (enrichedData.length > 0) {
      table.toggleAllRowsExpanded(true);
    }
  }, [enrichedData.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm animate-pulse">
        Loading warehouse layout...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        {error}
        <Button variant="link" size="sm" className="h-auto p-0 text-destructive underline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  if (enrichedData.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No locations defined for this warehouse yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => table.toggleAllRowsExpanded(true)}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.toggleAllRowsExpanded(false)}>
          Collapse All
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {table.getRowModel().rows.length} rows visible
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}
                  className={cn(
                    'cursor-pointer transition-colors group',
                    !row.original.is_active && 'opacity-50',
                    row.depth === 0 && 'bg-muted/30 font-semibold text-sm',
                    row.depth === 1 && 'bg-muted/10 text-sm',
                    row.depth === 2 && 'text-[13px]',
                    row.depth === 3 && 'text-xs',
                    row.depth >= 4 && 'text-[11px]',
                  )}
                  title={buildRowTooltip(row.original)}
                  onClick={() => onSelect?.(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
