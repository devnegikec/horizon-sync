import { apiRequest, buildPaginationParams } from '../utility/api/core';
import type { Invoice, InvoiceListResponse, InvoiceFormData } from '../types/invoice';

/**
 * Invoice API Client
 * Provides functions for invoice CRUD operations and related actions
 */

export interface InvoiceFilters {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateInvoiceFromSalesOrderData {
  posting_date: string;
  due_date: string;
  line_items: Array<{
    sales_order_line_item_id: string;
    quantity_to_bill: number;
  }>;
}

export interface SendInvoiceEmailData {
  to: string;
  subject: string;
  body: string;
}

/**
 * Invoice API client object with all invoice-related API functions
 */
export const invoiceApi = {
  /**
   * List invoices with pagination and filters
   */
  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: InvoiceFilters
  ): Promise<InvoiceListResponse> =>
    apiRequest('/invoices', accessToken, {
      params: {
        ...buildPaginationParams(
          page,
          pageSize,
          filters?.sort_by || 'posting_date',
          filters?.sort_order || 'desc'
        ),
        status: filters?.status,
        search: filters?.search,
        date_from: filters?.date_from,
        date_to: filters?.date_to,
      },
    }),

  /**
   * Get a single invoice by ID
   */
  get: (accessToken: string, id: string): Promise<Invoice> =>
    apiRequest(`/invoices/${id}`, accessToken),

  /**
   * Create a new invoice
   */
  create: (accessToken: string, data: InvoiceFormData): Promise<Invoice> =>
    apiRequest('/invoices', accessToken, {
      method: 'POST',
      body: data,
    }),

  /**
   * Update an existing invoice
   */
  update: (accessToken: string, id: string, data: InvoiceFormData): Promise<Invoice> =>
    apiRequest(`/invoices/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Delete an invoice (only allowed for Draft status)
   */
  delete: (accessToken: string, id: string): Promise<void> =>
    apiRequest(`/invoices/${id}`, accessToken, {
      method: 'DELETE',
    }),

  /**
   * Create an invoice from a sales order
   */
  createInvoiceFromSalesOrder: (
    accessToken: string,
    salesOrderId: string,
    data: CreateInvoiceFromSalesOrderData
  ): Promise<Invoice> =>
    apiRequest(`/invoices/from-sales-order/${salesOrderId}`, accessToken, {
      method: 'POST',
      body: data,
    }),

  /**
   * Generate and download invoice PDF
   */
  generateInvoicePDF: async (accessToken: string, invoiceId: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env['NX_API_CORE_URL'] || 'http://localhost:8000/api/v1'}/invoices/${invoiceId}/pdf`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate PDF: HTTP ${response.status}`);
    }

    return response.blob();
  },

  /**
   * Send invoice via email
   */
  sendInvoiceEmail: (
    accessToken: string,
    invoiceId: string,
    data: SendInvoiceEmailData
  ): Promise<{ message: string }> =>
    apiRequest(`/invoices/${invoiceId}/send-email`, accessToken, {
      method: 'POST',
      body: data,
    }),
};
