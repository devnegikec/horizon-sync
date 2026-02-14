import { apiRequest, buildPaginationParams } from '../utility/api/core';
import type { 
  Payment, 
  PaymentListResponse, 
  PaymentFormData,
  OutstandingInvoice 
} from '../types/payment';

/**
 * Payment API Client
 * Provides functions for payment CRUD operations and related actions
 */

export interface PaymentFilters {
  status?: string;
  payment_mode?: string;
  reconciliation_status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Payment API client object with all payment-related API functions
 */
export const paymentApi = {
  /**
   * List payments with pagination and filters
   */
  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: PaymentFilters
  ): Promise<PaymentListResponse> =>
    apiRequest('/payments', accessToken, {
      params: {
        ...buildPaginationParams(
          page,
          pageSize,
          filters?.sort_by || 'payment_date',
          filters?.sort_order || 'desc'
        ),
        status: filters?.status,
        payment_mode: filters?.payment_mode,
        reconciliation_status: filters?.reconciliation_status,
        search: filters?.search,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
      },
    }),

  /**
   * Get a single payment by ID
   */
  get: (accessToken: string, id: string): Promise<Payment> =>
    apiRequest(`/payments/${id}`, accessToken),

  /**
   * Create a new payment
   */
  create: (accessToken: string, data: PaymentFormData): Promise<Payment> =>
    apiRequest('/payments', accessToken, {
      method: 'POST',
      body: data,
    }),

  /**
   * Update an existing payment
   */
  update: (accessToken: string, id: string, data: PaymentFormData): Promise<Payment> =>
    apiRequest(`/payments/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete a payment (only allowed for Draft status)
   */
  delete: (accessToken: string, id: string): Promise<void> =>
    apiRequest(`/payments/${id}`, accessToken, {
      method: 'DELETE',
    }),

  /**
   * Get outstanding invoices for a party (for payment allocation)
   */
  getOutstandingInvoices: (
    accessToken: string,
    partyId: string,
    partyType: 'Customer' | 'Supplier'
  ): Promise<OutstandingInvoice[]> =>
    apiRequest(`/payments/outstanding-invoices/${partyId}`, accessToken, {
      params: {
        party_type: partyType,
      },
    }),
};
