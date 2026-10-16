import { environment } from '../../environments/environment';

const ITEMS_URL = `${environment.apiCoreUrl}/api/v1/items`;

export interface ItemListItem {
    id: string;
    item_code: string | null;
    item_name: string;
    item_type: string;
    uom: string | null;
    sku: string | null;
    status: string;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
    const body = await res.json().catch(() => null);
    const message = body?.detail?.message || body?.detail || body?.message || fallback;
    return new Error(typeof message === 'string' ? message : fallback);
}

export const itemService = {
    /** List org items (capped at 100 for the settings view). */
    async list(token: string): Promise<ItemListItem[]> {
        const res = await fetch(`${ITEMS_URL}?page_size=100`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to load items (HTTP ${res.status})`);
        }
        const data = await res.json();
        return Array.isArray(data?.items) ? data.items : [];
    },

    /** Search org items by code, name, sku or barcode. */
    async search(token: string, query: string, pageSize = 20): Promise<ItemListItem[]> {
        const res = await fetch(`${ITEMS_URL}?page_size=${pageSize}&search=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to search items (HTTP ${res.status})`);
        }
        const data = await res.json();
        return Array.isArray(data?.items) ? data.items : [];
    },

    /** Fetch a single item by ID. */
    async get(token: string, id: string): Promise<ItemListItem> {
        const res = await fetch(`${ITEMS_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw await parseError(res, `Failed to load item (HTTP ${res.status})`);
        }
        const data = await res.json();
        return {
            id: data.id,
            item_code: data.item_code ?? null,
            item_name: data.item_name,
            item_type: data.item_type ?? 'stock',
            uom: data.uom ?? null,
            sku: data.sku ?? null,
            status: data.status ?? 'active',
        };
    },
};
