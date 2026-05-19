import * as React from 'react';

import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';

import { cn } from '@horizon-sync/ui/lib';

import { useLocationTree } from '../../hooks/useWMS';
import type { LocationTree } from '../../types/wms.types';
import { LocationTypeBadge } from './WMSStatusBadge';

interface CapacityBarProps {
  total: number;
  available: number;
  className?: string;
}

function CapacityBar({ total, available, className }: CapacityBarProps) {
  if (total === 0) return null;
  const used = total - available;
  const pct = Math.round((used / total) * 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{pct}%</span>
    </div>
  );
}

interface TreeNodeProps {
  node: LocationTree;
  depth: number;
  onSelect?: (location: LocationTree) => void;
}

function TreeNode({ node, depth, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-accent group',
          !node.is_active && 'opacity-50',
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
        onClick={() => onSelect?.(node)}
      >
        {hasChildren ? (
          <button
            className="text-muted-foreground hover:text-foreground shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <LocationTypeBadge type={node.location_type} />
        <span className="font-mono text-sm font-medium">{node.code}</span>
        {node.name && <span className="text-muted-foreground text-sm truncate">— {node.name}</span>}

        {node.location_type === 'bin' && (
          <CapacityBar total={node.total_capacity} available={node.available_capacity} className="ml-auto w-28 shrink-0" />
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationTreeViewProps {
  warehouseId: string;
  onSelect?: (location: LocationTree) => void;
}

export function LocationTreeView({ warehouseId, onSelect }: LocationTreeViewProps) {
  const { tree, loading, error, refetch } = useLocationTree(warehouseId);

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm animate-pulse">
        Loading warehouse layout...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        {error}
        <button className="ml-2 underline" onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No locations defined for this warehouse yet.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} onSelect={onSelect} />
      ))}
    </div>
  );
}
