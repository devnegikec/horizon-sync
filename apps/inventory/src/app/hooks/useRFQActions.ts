import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { rfqApi } from '../utility/api';

export function useRFQActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const sendRFQ = async (id: string) => {
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
      const result = await rfqApi.send(accessToken, id);
      toast({
        title: 'Success',
        description: 'RFQ sent to suppliers successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send RFQ';
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

  const closeRFQ = async (id: string) => {
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
      const result = await rfqApi.close(accessToken, id);
      toast({
        title: 'Success',
        description: 'RFQ closed successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close RFQ';
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

  const deleteRFQ = async (id: string) => {
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
      await rfqApi.delete(accessToken, id);
      toast({
        title: 'Success',
        description: 'RFQ deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete RFQ';
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

  return {
    loading,
    sendRFQ,
    closeRFQ,
    deleteRFQ,
  };
}
