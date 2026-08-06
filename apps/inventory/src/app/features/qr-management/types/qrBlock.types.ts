export type QRType = 'D' | 'S' | 'B' | 'O' | 'SC';
export type SerialNumberType = 'R6DAN' | 'R4DAN' | 'S8DN' | 'S10DN';
export type BlockStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface QRBlockCreate {
  batch: string;
  quantity: number;
  qr_type?: QRType;
  serial_prefix?: string;
  sr_number_type?: SerialNumberType;
  qr_image?: boolean;
  manufacture_date?: string;
  expiry_date?: string;
  /** Enable master pack (cascade) — creates parent QSeal nodes grouping child codes */
  master_pack_enabled?: boolean;
  /** Number of child QR codes per master pack parent */
  master_pack_size?: number;
}

export interface QRBlock {
  id: string;
  product_id: string;
  organization_id: string;
  batch: string;
  quantity: number;
  qr_type: QRType | null;
  status: BlockStatus;
  progress?: number; // 0-100 percentage
  task_id: string | null;
  download_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Whether master pack (cascade) was enabled when creating this block */
  master_pack_enabled?: boolean;
  /** Number of child QR codes per master pack parent */
  master_pack_size?: number;
  /** Number of parent QSeal nodes created */
  qseal_parent_count?: number;
}

export interface QRBlockListResponse {
  blocks: QRBlock[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ProductItem {
  id: string;
  product_id: string;
  block_id: string;
  serial_number: string;
  qr_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  secret_code: string | null;
  created_at: string;
}
