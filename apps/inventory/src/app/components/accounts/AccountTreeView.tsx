import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Wallet, FolderTree, Loader2 } from 'lucide-react';

import { Card, CardContent, Badge } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { AccountType } from '../../types/account.types';

interface TreeNode {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  level: number;
  is_group: boolean;
  is_active: boolean;
  children: TreeNode[];
  childrenLoaded?: boolean; // Track if children have been loaded
  hasChildren?: boolean; // Track if node has children
}

interface AccountTreeViewProps {
  onAccountSelect?: (accountId: string) => void;
  selectedAccountId?: string | null;
  lazyLoad?: boolean; // Enable lazy loading mode
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  LIABILITY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  EQUITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  REVENUE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  EXPENSE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onAccountSelect?: (accountId: string) => void;
  selectedAccountId?: string | null;
  lazyLoad?: boolean;
  onLoadChildren?: (nodeId: string) => Promise<void>;
}

function TreeNodeItem({
  node,
  depth,
  expandedNodes,
  onToggleExpand,
  onAccountSelect,
  selectedAccountId,
  lazyLoad,
  onLoadChildren,
}: TreeNodeItemProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = lazyLoad 
    ? (node.hasChildren || (node.children && node.children.length > 0))
    : (node.children && node.children.length > 0);
  const isSelected = selectedAccountId === node.id;
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (hasChildren) {
      // If lazy loading and children not loaded yet, load them
      if (lazyLoad && !node.childrenLoaded && !isExpanded && onLoadChildren) {
        setLoading(true);
        try {
          await onLoadChildren(node.id);
        } finally {
          setLoading(false);
        }
      }
      onToggleExpand(node.id);
    }
    if (onAccountSelect) {
      onAccountSelect(node.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors hover:bg-muted/50',
          isSelected && 'bg-primary/10 hover:bg-primary/15',
          !node.is_active && 'opacity-60'
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 w-4 h-4">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Account Icon */}
        <div
          className={cn(
            'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg',
            hasChildren ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          {hasChildren ? (
            <FolderTree className="h-4 w-4 text-primary" />
          ) : (
            <Wallet className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Account Code */}
        <code className="text-sm bg-muted px-2 py-0.5 rounded font-medium flex-shrink-0">
          {node.account_code}
        </code>

        {/* Account Name */}
        <span className="text-sm font-medium flex-1 truncate">{node.account_name}</span>

        {/* Account Type Badge */}
        <Badge variant="secondary" className={cn('text-xs flex-shrink-0', ACCOUNT_TYPE_COLORS[node.account_type])}>
          {node.account_type}
        </Badge>

        {/* Status Badge */}
        {!node.is_active && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            Inactive
          </Badge>
        )}
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onAccountSelect={onAccountSelect}
              selectedAccountId={selectedAccountId}
              lazyLoad={lazyLoad}
              onLoadChildren={onLoadChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountTreeView({ onAccountSelect, selectedAccountId, lazyLoad = false }: AccountTreeViewProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = lazyLoad 
        ? '/api/v1/chart-of-accounts/tree?lazy_load=true'
        : '/api/v1/chart-of-accounts/tree';

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account tree');
      }

      const data = await response.json();
      
      // Mark nodes with children info for lazy loading
      if (lazyLoad) {
        const processedData = data.map((node: TreeNode) => ({
          ...node,
          childrenLoaded: false,
          hasChildren: node.children && node.children.length === 0 ? true : false, // Empty array means has children
        }));
        setTreeData(processedData);
      } else {
        setTreeData(data);
        // Auto-expand root level nodes
        const rootNodeIds = data.map((node: TreeNode) => node.id);
        setExpandedNodes(new Set(rootNodeIds));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (nodeId: string) => {
    try {
      const response = await fetch(`/api/v1/chart-of-accounts/tree/${nodeId}/children`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load children');
      }

      const children = await response.json();

      // Update tree data with loaded children
      setTreeData((prevData) => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                children: children.map((child: TreeNode) => ({
                  ...child,
                  childrenLoaded: false,
                  hasChildren: child.children && child.children.length === 0 ? true : false,
                })),
                childrenLoaded: true,
              };
            }
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: updateNode(node.children),
              };
            }
            return node;
          });
        };
        return updateNode(prevData);
      });
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        allNodeIds.add(node.id);
        if (node.children && node.children.length > 0) {
          collectNodeIds(node.children);
        }
      });
    };
    collectNodeIds(treeData);
    setExpandedNodes(allNodeIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (treeData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<FolderTree className="h-12 w-12" />}
            title="No accounts found"
            description="Create your first account to see the hierarchy tree"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Tree Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Account Hierarchy</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Expand All
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree View */}
        <div className="p-2 max-h-[600px] overflow-y-auto">
          {treeData.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              depth={0}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
              onAccountSelect={onAccountSelect}
              selectedAccountId={selectedAccountId}
              lazyLoad={lazyLoad}
              onLoadChildren={loadChildren}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
