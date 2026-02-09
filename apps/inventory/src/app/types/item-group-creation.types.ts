export interface CreateItemGroupPayload {
  name: string;
  code: string;
  description: string;
  parent_id: string | null;
  default_valuation_method: string;
  default_uom: string;
  is_active: boolean;
  extra_data: Record<string, unknown>;
}

export interface ItemGroupFormData {
  name: string;
  code: string;
  default_uom: string;
}

export interface CreateItemGroupResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  default_uom: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}