import { PaymentTransaction, CreatePaymentFormData } from '../types';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

class PaymentService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    private getAuthToken(): string {
        return localStorage.getItem('auth_token') || '';
    }

    // Create payment transaction
    async createPayment(data: CreatePaymentFormData): Promise<PaymentTransaction> {
        return this.request<PaymentTransaction>('/payments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Get payment transactions
    async getPayments(params?: {
        account_id?: string;
        status?: string;
        transaction_type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ items: PaymentTransaction[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.account_id) searchParams.set('account_id', params.account_id);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.transaction_type) searchParams.set('transaction_type', params.transaction_type);
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return this.request<{ items: PaymentTransaction[]; total: number }>(`/payments${query}`);
    }

    // Get specific payment
    async getPayment(paymentId: string): Promise<PaymentTransaction> {
        return this.request<PaymentTransaction>(`/payments/${paymentId}`);
    }

    // Cancel payment
    async cancelPayment(paymentId: string): Promise<PaymentTransaction> {
        return this.request<PaymentTransaction>(`/payments/${paymentId}/cancel`, {
            method: 'PUT',
        });
    }

    // Approve payment (for dual approval workflow)
    async approvePayment(paymentId: string): Promise<PaymentTransaction> {
        return this.request<PaymentTransaction>(`/payments/${paymentId}/approve`, {
            method: 'PUT',
        });
    }

    // Process scheduled payments
    async processScheduledPayments(): Promise<{ processed: number; failed: number }> {
        return this.request<{ processed: number; failed: number }>('/payments/process-scheduled', {
            method: 'POST',
        });
    }

    // Create transfer between accounts
    async createTransfer(data: {
        from_account_id: string;
        to_account_id: string;
        amount: number;
        description: string;
        reference_number?: string;
    }): Promise<PaymentTransaction> {
        return this.request<PaymentTransaction>('/transfers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Get transfer history
    async getTransferHistory(accountId?: string): Promise<PaymentTransaction[]> {
        const params = accountId ? `?account_id=${accountId}` : '';
        return this.request<PaymentTransaction[]>(`/transfers${params}`);
    }
}

export const paymentService = new PaymentService();