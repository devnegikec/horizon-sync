export type QRType =
  | 'dynamic'
  | 'static'
  | 'dual'
  | 'secure_code'
  | 'one_time'
  | 'post_activation';
export type SerialNumberType = 'R8DAN' | 'R6DAN' | 'R4DAN' | 'S8DN' | 'S10DN';
export type BlockStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type BlockActivationStatus = 'activated' | 'deactivated' | 'partially_activated';
export type QRBlockFilterType = 'dynamic' | 'dual' | 'secure_code' | 'one_time';

export interface QRBlockFilters {
  search?: string;
  product_id?: string;
  status?: BlockStatus;
  qr_type?: QRBlockFilterType;
  created_from?: string;
  created_to?: string;
}

export interface QRBlockListParams extends QRBlockFilters {
  page?: number;
  page_size?: number;
}

export interface QRBlockCreate {
  batch: string;
  quantity: number;
  sku_id?: string;
  channel_setting_id?: string;
  destination_setting_id?: string;
  qr_type?: QRType;
  serial_prefix?: string;
  starting_serial?: string;
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
  product_name?: string | null;
  sku_id: string | null;
  channel_setting_id: string | null;
  destination_setting_id: string | null;
  distribution_channel: string | null;
  destination_market: string | null;
  batch: string;
  quantity: number;
  qr_type: QRType | null;
  serial_prefix: string | null;
  starting_serial: string | null;
  sr_number_type: SerialNumberType | null;
  status: BlockStatus;
  progress: number;
  generated_count: number;
  error_code: string | null;
  error_message: string | null;
  task_id: string | null;
  download_url: string | null;
  download_available: boolean;
  artifact_generated_at: string | null;
  activation_status?: BlockActivationStatus | null;
  activated_count?: number;
  deactivated_count?: number;
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
