import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks';
import { materialRequestApi } from '../utility/api';
import type { MaterialRequest, CreateMaterialRequestPayload, UpdateMaterialRequestPayload } from '../types/material-request.types';

export function useMaterialRequestActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createMaterialRequest = async (payload: CreateMaterialRequestPayload): Promise<MaterialRequest | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await materialRequestApi.create(accessToken, payload);
      toast({
        title: 'Success',
        description: 'Material Request created successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create material request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMaterialRequest = async (id: string, payload: UpdateMaterialRequestPayload): Promise<MaterialRequest | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await materialRequestApi.update(accessToken, id, payload);
      toast({
        title: 'Success',
        description: 'Material Request updated successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update material request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterialRequest = async (id: string): Promise<boolean> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      await materialRequestApi.delete(accessToken, id);
      toast({
        title: 'Success',
        description: 'Material Request deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete material request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitMaterialRequest = async (id: string): Promise<MaterialRequest | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await materialRequestApi.submit(accessToken, id);
      toast({
        title: 'Success',
        description: 'Material Request submitted successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit material request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelMaterialRequest = async (id: string): Promise<MaterialRequest | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await materialRequestApi.cancel(accessToken, id);
      toast({
        title: 'Success',
        description: 'Material Request cancelled successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel material request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createMaterialRequest,
    updateMaterialRequest,
    deleteMaterialRequest,
    submitMaterialRequest,
    cancelMaterialRequest,
  };
}
