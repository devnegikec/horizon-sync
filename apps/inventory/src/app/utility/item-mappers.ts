import type { Item } from '../types/item.types';
import type { ApiItem } from '../types/items-api.types';

export function apiItemToItem(api: ApiItem): Item {
  return {
    id: api.id,
    itemCode: api.item_code,
    name: api.item_name,
    description: '',
    unitOfMeasure: api.uom ?? '',
    defaultPrice: api.standard_rate != null ? parseFloat(api.standard_rate) : 0,
    itemGroupId: api.item_group_id ?? '',
    itemGroupName: api.item_group_name ?? '',
    currentStock: 0,
    status: (api.status === 'active' || api.status === 'inactive' ? api.status : 'active') as Item['status'],
    createdAt: api.created_at ?? '',
    updatedAt: '',
  };
}
