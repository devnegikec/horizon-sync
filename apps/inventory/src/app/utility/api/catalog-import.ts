import { apiRequest } from './core';

export type CatalogImportMode =
    | 'product_only'
    | 'product_with_items'
    | 'item_with_auto_product';

export interface CatalogImportRow {
    name?: string | null;
    sku?: string | null;
    gtin?: string | null;
    description?: string | null;
    brand_id?: string | null;
    category_id?: string | null;
    uom?: string | null;
    item_code?: string | null;
    item_group_id?: string | null;
    has_batch_no?: boolean;
    has_serial_no?: boolean;
    variant_of?: string | null;
    variant_attributes?: Record<string, unknown> | null;
    item_id?: string | null;
    action?: 'create' | 'modify' | 'delete' | null;
}

export interface CatalogImportRequest {
    mode: CatalogImportMode;
    rows: CatalogImportRow[];
}

export interface CatalogImportError {
    row: number;
    error: string;
}

export interface CatalogImportResponse {
    created: number;
    updated: number;
    deleted?: number;
    errors: CatalogImportError[];
}

export const catalogImportApi = {
    import: (accessToken: string, payload: CatalogImportRequest) =>
        apiRequest<CatalogImportResponse>('/catalog-import', accessToken, {
            method: 'POST',
            body: payload,
        }),
};
