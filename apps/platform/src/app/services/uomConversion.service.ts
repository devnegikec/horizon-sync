import { environment } from '../../environments/environment';

const UOM_CONVERSIONS_URL = `${environment.apiCoreUrl}/api/v1/uom-conversions`;

export interface UomConversion {
    id: string;
    organization_id: string;
    item_id: string | null;
    from_uom: string;
    to_uom: string;
    from_uom_id: string | null;
    to_uom_id: string | null;
    conversion_factor: number | string;
    created_at?: string;
    updated_at?: string;
}

export interface BulkConversionRow {
    item_id: string | null;
    from_uom: string;
    to_uom: string;
    from_uom_id?: string | null;
    to_uom_id?: string | null;
    conversion_factor: number;
    action?: 'create' | 'modify' | 'delete' | null;
}

export interface BulkConversionError {
    row: number;
    error: string;
}

export interface BulkConversionResponse {
    created: number;
    updated: number;
    deleted?: number;
    errors: BulkConversionError[];
}

async function parseError(res: Response, fallback: string): Promise<Error> {
    const body = await res.json().catch(() => null);
    const message = body?.detail?.message || body?.detail || body?.message || fallback;
    return new Error(typeof message === 'string' ? message : fallback);
}

export const uomConversionService = {
    /** List all org UOM conversions (capped at 100 for the settings view). */
    async list(token: string): Promise<UomConversion[]> {
        const res = await fetch(`${UOM_CONVERSIONS_URL}?page_size=100`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to load UOM conversions (HTTP ${res.status})`);
        }
        const data = await res.json();
        return Array.isArray(data?.uom_conversions) ? data.uom_conversions : [];
    },

    /** Bulk upsert UOM conversions in a single request. */
    async bulkUpsert(token: string, rows: BulkConversionRow[]): Promise<BulkConversionResponse> {
        const res = await fetch(`${UOM_CONVERSIONS_URL}/bulk`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversions: rows }),
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to save UOM conversions (HTTP ${res.status})`);
        }
        return res.json();
    },
};
