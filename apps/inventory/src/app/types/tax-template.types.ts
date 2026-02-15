// Tax Template Types
export type TaxCategory = 'Input' | 'Output';
export type TaxType = 'GST' | 'VAT' | 'CGST' | 'SGST' | 'IGST' | 'Sales Tax' | 'Custom';

export interface TaxRule {
  id: string;
  tax_template_id: string;
  rule_name: string;
  tax_type: TaxType | string;
  description?: string;
  tax_rate: number;
  account_head_id: string;
  is_compound: boolean;
  sequence: number;
  applicability_conditions?: Record<string, any>;
}

export interface TaxTemplate {
  id: string;
  organization_id: string;
  template_code: string;
  template_name: string;
  description?: string;
  tax_category: TaxCategory;
  is_default: boolean;
  is_active: boolean;
  applicability_rules: Record<string, any>;
  extra_data: Record<string, any>;
  tax_rules: TaxRule[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaxTemplateCreate {
  template_code: string;
  template_name: string;
  description?: string;
  tax_category: TaxCategory;
  is_default?: boolean;
  is_active?: boolean;
  applicability_rules?: Record<string, any>;
  tax_rules: Omit<TaxRule, 'id' | 'tax_template_id'>[];
}

export interface TaxTemplateUpdate {
  template_name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  applicability_rules?: Record<string, any>;
  tax_rules?: Omit<TaxRule, 'id' | 'tax_template_id'>[];
}

export interface TaxTemplateListResponse {
  data: TaxTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
