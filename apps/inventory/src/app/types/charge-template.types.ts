// Charge Template Types
export type ChargeType = 'Shipping' | 'Handling' | 'Packaging' | 'Insurance' | 'Custom';
export type CalculationMethod = 'FIXED' | 'PERCENTAGE';
export type BaseOn = 'Net_Total' | 'Grand_Total';

export interface ChargeTemplate {
  id: string;
  organization_id: string;
  template_code: string;
  template_name: string;
  charge_type: ChargeType;
  description?: string;
  calculation_method: CalculationMethod;
  fixed_amount?: number;
  percentage_rate?: number;
  base_on?: BaseOn;
  account_head_id: string;
  is_active: boolean;
  applicability_rules: Record<string, any>;
  extra_data: Record<string, any>;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChargeTemplateCreate {
  template_code: string;
  template_name: string;
  charge_type: ChargeType;
  description?: string;
  calculation_method: CalculationMethod;
  fixed_amount?: number;
  percentage_rate?: number;
  base_on?: BaseOn;
  account_head_id: string;
  is_active?: boolean;
  applicability_rules?: Record<string, any>;
}

export interface ChargeTemplateUpdate {
  template_name?: string;
  charge_type?: ChargeType;
  description?: string;
  calculation_method?: CalculationMethod;
  fixed_amount?: number;
  percentage_rate?: number;
  base_on?: BaseOn;
  account_head_id?: string;
  is_active?: boolean;
  applicability_rules?: Record<string, any>;
}

export interface ChargeTemplateListResponse {
  data: ChargeTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
