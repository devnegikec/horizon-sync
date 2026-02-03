import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { Customer } from '../types/customer.types';
import { customerApi } from '../utility/api';


export function useCustomerActions() {
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);

  const updateStatus = React.useCallback(
    async (customer: Customer, newStatus: Customer['status'], onSuccess?: () => void) => {
      if (!accessToken) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        // Prepare the data for the PUT request
        // Based on the provided curl, we should send the full customer object or at least required fields
        const updateData: Partial<Customer> = {
          ...customer,
          status: newStatus,
        };

        await customerApi.update(accessToken, customer.id, updateData);

        toast({
          title: 'Success',
          description: `Customer status updated to ${newStatus}`,
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error updating customer status:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update customer status',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [accessToken, toast]
  );

  return {
    updateStatus,
    loading,
  };
}
