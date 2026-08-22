export interface QRCreditBalance {
  organization_id: string;
  total_credits: number;
  used_credits: number;
  reserved_credits: number;
  balance_credits: number;
  updated_at: string | null;
}

export interface QRCreditLedgerItem {
  id: string;
  organization_id: string;
  transaction_type: 'credit_addition' | 'block_consumption';
  amount: number;
  balance_after: number;
  block_id: string | null;
  reason: string | null;
  created_by: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface QRCreditLedgerResponse {
  transactions: QRCreditLedgerItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
