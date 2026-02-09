import type { CreateItemGroupPayload, ItemGroupFormData } from '../types/item-group-creation.types';

export function buildCreateItemGroupPayload(formData: ItemGroupFormData): CreateItemGroupPayload {
  return {
    name: formData.name,
    code: formData.code,
    description: formData.name, // Use name as description by default
    parent_id: null, // No parent for new groups
    default_valuation_method: 'fifo', // Default valuation method
    default_uom: formData.default_uom,
    is_active: true, // Active by default
    extra_data: {}, // Empty extra data
  };
}