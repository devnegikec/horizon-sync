import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services';
import { PaymentTransaction, CreatePaymentFormData } from '../types';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Query keys for caching
const PAYMENT_KEYS = {
    all: ['payments'] as const,
    byAccount: (accountId: string) => ['payments', 'account', accountId] as const,
    byId: (id: string) => ['payments', id] as const,
    transfers: ['transfers'] as const,
    transferHistory: (accountId?: string) => ['transfers', 'history', accountId] as const,
} as const;

// Hook to get payments
export function usePayments(params?: {
    account_id?: string;
    status?: string;
    transaction_type?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: ['payments', params],
        queryFn: () => paymentService.getPayments(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Hook to get a specific payment
export function usePayment(paymentId: string) {
    return useQuery({
        queryKey: PAYMENT_KEYS.byId(paymentId),
        queryFn: () => paymentService.getPayment(paymentId),
        enabled: !!paymentId,
    });
}

// Hook to get transfer history
export function useTransferHistory(accountId?: string) {
    return useQuery({
        queryKey: PAYMENT_KEYS.transferHistory(accountId),
        queryFn: () => paymentService.getTransferHistory(accountId),
    });
}

// Hook to create a payment
export function useCreatePayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: paymentService.createPayment,
        onSuccess: (newPayment) => {
            // Invalidate payments queries
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

            toast({
                title: 'Payment Created',
                description: `Payment of ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: newPayment.currency,
                }).format(newPayment.amount)} has been created.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Payment',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to create a transfer
export function useCreateTransfer() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: paymentService.createTransfer,
        onSuccess: (newTransfer) => {
            // Invalidate transfer and payment queries
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.transfers });
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

            toast({
                title: 'Transfer Created',
                description: `Transfer of ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: newTransfer.currency,
                }).format(newTransfer.amount)} has been initiated.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Transfer',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to cancel a payment
export function useCancelPayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: paymentService.cancelPayment,
        onSuccess: (canceledPayment) => {
            // Update the payment in cache
            queryClient.setQueryData(
                PAYMENT_KEYS.byId(canceledPayment.id),
                canceledPayment
            );

            // Invalidate payment lists
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

            toast({
                title: 'Payment Canceled',
                description: 'The payment has been successfully canceled.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Canceling Payment',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to approve a payment
export function useApprovePayment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: paymentService.approvePayment,
        onSuccess: (approvedPayment) => {
            // Update the payment in cache
            queryClient.setQueryData(
                PAYMENT_KEYS.byId(approvedPayment.id),
                approvedPayment
            );

            // Invalidate payment lists
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

            toast({
                title: 'Payment Approved',
                description: 'The payment has been approved and will be processed.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Approving Payment',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to process scheduled payments
export function useProcessScheduledPayments() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: paymentService.processScheduledPayments,
        onSuccess: (result) => {
            // Invalidate payment queries to refresh data
            queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });

            toast({
                title: 'Scheduled Payments Processed',
                description: `${result.processed} payments processed, ${result.failed} failed.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Processing Scheduled Payments',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}