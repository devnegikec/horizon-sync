/** API item group from GET item-groups/active */
export interface ApiItemGroup {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  default_valuation_method: string | null;
  default_uom: string | null;
  is_active: boolean;
  created_at: string | null;
}
