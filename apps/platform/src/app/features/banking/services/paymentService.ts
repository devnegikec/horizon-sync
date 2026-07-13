import { PaymentTransaction, CreatePaymentFormData } from '../types';
import { coreApiClient } from '../../../utility/api-core';

class PaymentService {
    // Create payment transaction
    async createPayment(data: CreatePaymentFormData): Promise<PaymentTransaction> {
        return coreApiClient.post<PaymentTransaction>('/payments', data);
    }

    // Get payment transactions
    async getPayments(params?: {
        account_id?: string;
        status?: string;
        transaction_type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ items: PaymentTransaction[]; total: number }> {
        return coreApiClient.get<{ items: PaymentTransaction[]; total: number }>('/payments', {
            account_id: params?.account_id,
            status: params?.status,
            transaction_type: params?.transaction_type,
            limit: params?.limit,
            offset: params?.offset,
        });
    }

    // Get specific payment
    async getPayment(paymentId: string): Promise<PaymentTransaction> {
        return coreApiClient.get<PaymentTransaction>(`/payments/${paymentId}`);
    }

    // Cancel payment
    async cancelPayment(paymentId: string): Promise<PaymentTransaction> {
        return coreApiClient.put<PaymentTransaction>(`/payments/${paymentId}/cancel`);
    }

    // Approve payment (for dual approval workflow)
    async approvePayment(paymentId: string): Promise<PaymentTransaction> {
        return coreApiClient.put<PaymentTransaction>(`/payments/${paymentId}/approve`);
    }

    // Process scheduled payments
    async processScheduledPayments(): Promise<{ processed: number; failed: number }> {
        return coreApiClient.post<{ processed: number; failed: number }>('/payments/process-scheduled');
    }

    // Create transfer between accounts
    async createTransfer(data: {
        from_account_id: string;
        to_account_id: string;
        amount: number;
        description: string;
        reference_number?: string;
    }): Promise<PaymentTransaction> {
        return coreApiClient.post<PaymentTransaction>('/transfers', data);
    }

    // Get transfer history
    async getTransferHistory(accountId?: string): Promise<PaymentTransaction[]> {
        return coreApiClient.get<PaymentTransaction[]>('/transfers', {
            account_id: accountId,
        });
    }
}

export const paymentService = new PaymentService();
