/**
 * React-query hooks for the CSV-based stock reconciliation flow:
 *   1. useDownloadReconciliationTemplate  — GET  /stock-reconciliations/template
 *   2. useUploadReconciliation            — POST /stock-reconciliations/upload
 *   3. useConfirmReconciliation           — POST /stock-reconciliations/{id}/confirm
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type {
  ReconciliationUploadResponse,
  ReconciliationConfirmResponse,
} from '../types/reconciliation.types';
import { stockReconciliationApi } from '../utility/api/stock';

// Shared query key so confirm can invalidate the list
export const RECONCILIATIONS_QUERY_KEY = ['stock-reconciliations'] as const;

// ── 1. Download template ───────────────────────────────────────────

export function useDownloadReconciliationTemplate() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ warehouseId, warehouseName }: { warehouseId: string; warehouseName: string }) => {
      if (!accessToken) throw new Error('Not authenticated');
      const blob = await stockReconciliationApi.downloadTemplate(accessToken, warehouseId);
      return { blob, warehouseName };
    },
    onSuccess: ({ blob, warehouseName }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock-reconciliation-${warehouseName.replace(/\s+/g, '-').toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded', description: `CSV template for ${warehouseName} is ready.` });
    },
    onError: (err) => {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not download template',
        variant: 'destructive',
      });
    },
  });
}

// ── 2. Upload CSV ──────────────────────────────────────────────────

export function useUploadReconciliation() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ warehouseId, file, reconciliationId }: { warehouseId: string; file: File; reconciliationId?: string }) => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await stockReconciliationApi.upload(accessToken, warehouseId, file, reconciliationId);
      return result as ReconciliationUploadResponse;
    },
    onError: (err) => {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not process the CSV file',
        variant: 'destructive',
      });
    },
  });
}

// ── 3. Confirm reconciliation ──────────────────────────────────────

export function useConfirmReconciliation() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reconciliationId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await stockReconciliationApi.confirm(accessToken, reconciliationId);
      return result as ReconciliationConfirmResponse;
    },
    onSuccess: (data) => {
      toast({
        title: 'Reconciliation confirmed',
        description: `${data.adjustments_made} adjustment(s) applied, ${data.stock_movements_created} stock movement(s) created.`,
      });
      queryClient.invalidateQueries({ queryKey: RECONCILIATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: (err) => {
      toast({
        title: 'Confirmation failed',
        description: err instanceof Error ? err.message : 'Could not confirm reconciliation',
        variant: 'destructive',
      });
    },
  });
}
