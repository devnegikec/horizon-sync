export const ITEM_TYPE_OPTIONS = ['stock', 'service', 'consumable'] as const;

export const VALUATION_METHOD_OPTIONS = ['FIFO', 'LIFO', 'Moving Average'] as const;

export const WEIGHT_UOM_OPTIONS = ['kg', 'g', 'lb', 'oz'] as const;

export const ITEM_STATUS_OPTIONS = ['active', 'inactive'] as const;

export type ItemType = typeof ITEM_TYPE_OPTIONS[number];
export type ValuationMethod = typeof VALUATION_METHOD_OPTIONS[number];
export type WeightUOM = typeof WEIGHT_UOM_OPTIONS[number];
export type ItemStatus = typeof ITEM_STATUS_OPTIONS[number];
