import * as React from 'react';

import { ClipboardList, Loader2, Package, Truck, Warehouse, AlertTriangle, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Card, CardContent } from '@horizon-sync/ui/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useDeliveryFromPickList } from '../../hooks/useSmartPicking';
import type { SmartPickListResponse } from '../../types/smart-picking.types';
import { smartPickingApi } from '../../utility/api/smart-picking';

/**
 * Placeholder Pick List management view.
 * The smart-picking API currently only exposes create + delivery-from-pick-list.
 * Once a list endpoint is available this component can be expanded.
 * For now it shows a helpful empty state that directs users to Sales Orders.
 */
export function PickListManagement() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pick Lists1</h2>
          <p className="text-muted-foreground">
            Manage warehouse pick lists for sales order fulfillment.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <EmptyState icon={<ClipboardList className="h-12 w-12" />}
            title="Pick lists are created from Sales Orders"
            description="Open a confirmed Sales Order and select 'Create Pick List' from the actions menu to generate smart warehouse allocations."/>
        </CardContent>
      </Card>
    </div>
  );
}
