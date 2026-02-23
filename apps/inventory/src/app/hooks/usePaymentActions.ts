import { useState } from 'react';
import { useToast } from '@horizon-sync/ui/hooks';
import { paymentApi } from '../utility/api';
import type {
  PaymentEntry,
  CreatePaymentPayload,
  UpdatePaymentPayload,
} from '../types/payment.types';

export function usePaymentActions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPayment = async (payload: CreatePaymentPayload): Promise<PaymentEntry | null> => {
    setLoading(true);
    try {
      const result = await paymentApi.createPaymentEntry(payload);
      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
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

  const updatePayment = async (
    id: string,
    payload: UpdatePaymentPayload
  ): Promise<PaymentEntry | null> => {
    setLoading(true);
    try {
      const result = await paymentApi.updatePaymentEntry(id, payload);
      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
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

  const confirmPayment = async (id: string): Promise<PaymentEntry | null> => {
    setLoading(true);
    try {
      const result = await paymentApi.confirmPaymentEntry(id);
      toast({
        title: 'Success',
        description: 'Payment confirmed successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm payment';
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

  const cancelPayment = async (
    id: string,
    reason: string
  ): Promise<PaymentEntry | null> => {
    setLoading(true);
    try {
      const result = await paymentApi.cancelPaymentEntry(id, reason);
      toast({
        title: 'Success',
        description: 'Payment cancelled successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel payment';
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

  const downloadReceipt = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const blob = await paymentApi.downloadReceipt(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Receipt downloaded successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download receipt';
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
    createPayment,
    updatePayment,
    confirmPayment,
    cancelPayment,
    downloadReceipt,
  };
}
