export type SettingType = 'serial_prefix' | 'channel' | 'destination' | 'shelf_life';

export interface QRProductSetting {
  id: string;
  organization_id: string;
  setting_type: SettingType;
  value: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface QRProductSettingCreate {
  setting_type: SettingType;
  value: string;
  label: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
  extra_data?: Record<string, unknown> | null;
}

export interface QRProductSettingUpdate {
  value?: string;
  label?: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
  extra_data?: Record<string, unknown> | null;
}

export interface QRProductSettingListResponse {
  settings: QRProductSetting[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
