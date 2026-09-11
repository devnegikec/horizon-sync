export interface QSealActivationSettings {
  id: string;
  product_id: string;
  dispatch_batch: string | null;
  batch_size: number | null;
  manufacturing_date: string;
  manufacturing_unit: string;
  destination_market: string | null;
  currency: string | null;
  mrp: string | number | null;
  expiry_date: string;
  history: boolean;
  created_on: string;
}

export interface QSealActivationSummary {
  product_id: string;
  activation_method: string | null;
  total_blocks: number;
  activated_blocks: number;
  available_blocks: number;
  activation_percentage: number;
  current_settings: QSealActivationSettings | null;
}

export interface QSealActivationSettingsInput {
  dispatch_batch: string;
  batch_size: number;
  manufacturing_date: string;
  manufacturing_unit: string;
  destination_market: string;
  mrp: string;
  append_to_existing?: boolean;
}

export interface QSealActivationSettingsSaveResponse {
  message: string;
  settings_id: string;
  expiry_date: string;
  currency: string;
}

export interface QSealActivationHistoryResponse {
  items: QSealActivationSettings[];
  page: number;
  page_size: number;
  total: number;
}

export interface QSealDestinationMarket {
  id: string;
  name: string;
  code: string;
  country: string | null;
  currency: string | null;
  is_active: boolean;
}

export interface QSealDestinationMarketResponse {
  markets: QSealDestinationMarket[];
  pagination: Record<string, unknown>;
}
