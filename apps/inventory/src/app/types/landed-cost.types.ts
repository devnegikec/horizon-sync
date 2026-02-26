/**
 * Landed Cost Types
 * Based on backend schema: core-service/app/schemas/landed_cost.py
 */

export interface LandedCostVoucher {
  id: string;
  organization_id: string;
  voucher_no: string;
  posting_date: string;
  status: 'draft' | 'submitted' | 'cancelled';
  remarks?: string;
  submitted_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export type LandedCostStatus = LandedCostVoucher['status'];

export interface LandedCostVoucherListItem {
  id: string;
  organization_id: string;
  voucher_no: string;
  status: string;
  posting_date: string;
  created_at: string;
}

export interface CreateLandedCostVoucherPayload {
  voucher_no: string;
  posting_date: string;
  status?: 'draft' | 'submitted' | 'cancelled';
  remarks?: string;
}

export interface UpdateLandedCostVoucherPayload {
  posting_date?: string;
  status?: 'draft' | 'submitted' | 'cancelled';
  remarks?: string;
}

export interface LandedCostVoucherFilters {
  page?: number;
  page_size?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface LandedCostVouchersResponse {
  vouchers: LandedCostVoucherListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
