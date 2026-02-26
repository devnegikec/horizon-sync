import * as React from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { smartPickingApi } from '../utility/api/smart-picking';
import type {
  AllocationSuggestionResponse,
  SmartPickAllocation,
  SmartPickListResponse,
  DeliveryNoteFromPickListResponse,
} from '../types/smart-picking.types';

export function useSuggestAllocation() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<AllocationSuggestionResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSuggestions = React.useCallback(
    async (salesOrderId: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const result = await smartPickingApi.suggestAllocation(accessToken, salesOrderId);
        setData(result);
        return result;
      } catch (err: any) {
        const msg = err.details?.detail || err.message || 'Failed to fetch allocation suggestions';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { data, loading, error, fetchSuggestions };
}

export function useCreatePickList() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createPickList = React.useCallback(
    async (salesOrderId: string, allocations: SmartPickAllocation[], remarks?: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const result = await smartPickingApi.createPickList(accessToken, {
          sales_order_id: salesOrderId,
          allocations,
          remarks: remarks || null,
        });
        toast({
          title: 'Pick List Created',
          description: `Pick List ${result.pick_list_no} created successfully.`,
        });
        return result;
      } catch (err: any) {
        const msg = err.details?.detail || err.message || 'Failed to create pick list';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, toast],
  );

  return { createPickList, loading, error };
}

export function useDeliveryFromPickList() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createDelivery = React.useCallback(
    async (pickListId: string, deliveryDate?: string, remarks?: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const result = await smartPickingApi.createDeliveryFromPickList(accessToken, {
          pick_list_id: pickListId,
          delivery_date: deliveryDate || null,
          remarks: remarks || null,
        });
        toast({
          title: 'Delivery Note Created',
          description: `Delivery Note ${result.delivery_note_no} created. ${result.stock_movements_created} stock movements recorded.`,
        });
        return result;
      } catch (err: any) {
        const msg = err.details?.detail || err.message || 'Failed to create delivery note';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, toast],
  );

  return { createDelivery, loading, error };
}
