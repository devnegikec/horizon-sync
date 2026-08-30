import { Page } from '@playwright/test';

import { seedAuth } from './warehouse';

/** Minimal ASN order shape used to seed the mocked ASN API. */
export interface E2EAsnOrder {
  id: string;
  asn_order_no: string;
  status: string;
  order_date: string;
  delivery_date: string | null;
  grand_total: number;
  warehouse_id_from: string;
  warehouse_id_to: string;
  remarks: string | null;
  from_warehouse: { id: string; name: string; code: string | null } | null;
  to_warehouse: { id: string; name: string; code: string | null } | null;
  items: Array<{
    id: string;
    item_id: string;
    item_name: string;
    item_sku: string;
    qty: number;
    uom: string;
    sort_order: number;
    delivered_qty: number;
    created_at: string;
    updated_at: string;
  }>;
  vehicle_arrivals: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

export function makeAsnOrder(overrides: Partial<E2EAsnOrder> = {}): E2EAsnOrder {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    asn_order_no: 'ASN-2026-00001',
    status: 'draft',
    order_date: '2026-01-05',
    delivery_date: '2026-01-10',
    grand_total: 100,
    warehouse_id_from: 'wh-from-1',
    warehouse_id_to: 'wh-to-1',
    remarks: 'Urgent shipment',
    from_warehouse: { id: 'wh-from-1', name: 'Source WH', code: 'WH-SRC' },
    to_warehouse: { id: 'wh-to-1', name: 'Target WH', code: 'WH-TGT' },
    items: [
      {
        id: 'item-1',
        item_id: 'it-1',
        item_name: 'Test Item',
        item_sku: 'SKU-001',
        qty: 10,
        uom: 'pcs',
        sort_order: 1,
        delivered_qty: 0,
        created_at: '2026-01-05T00:00:00Z',
        updated_at: '2026-01-05T00:00:00Z',
      },
    ],
    vehicle_arrivals: [],
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
    ...overrides,
  };
}

const E2E_WAREHOUSES = [
  {
    id: 'wh-from-1',
    name: 'Source WH',
    code: 'WH-SRC',
    warehouse_type: 'warehouse',
    is_active: true,
    is_default: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wh-to-1',
    name: 'Target WH',
    code: 'WH-TGT',
    warehouse_type: 'warehouse',
    is_active: true,
    is_default: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export interface AsnApiTracker {
  calls: Array<{ method: string; url: string; body: unknown }>;
}

/**
 * Mock the ASN list / detail endpoints and the warehouse lists the dialog
 * fetches when it opens. Record all calls so tests can assert on saves.
 */
export async function mockAsnApi(page: Page, orders: E2EAsnOrder[]): Promise<AsnApiTracker> {
  const calls: AsnApiTracker['calls'] = [];

  await page.route('**/api/v1/asn-orders**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    let body: unknown = undefined;
    if (method !== 'GET') {
      try {
        body = route.request().postDataJSON();
      } catch {
        body = null;
      }
    }
    calls.push({ method, url, body });

    if (method === 'GET') {
      const pathname = new URL(url).pathname;
      const id = pathname.endsWith('/asn-orders') ? null : pathname.split('/').pop();

      if (id) {
        const order = orders.find((o) => o.id === id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(order ?? {}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            asn_orders: orders.map((o) => ({
              id: o.id,
              asn_order_no: o.asn_order_no,
              status: o.status,
              order_date: o.order_date,
              delivery_date: o.delivery_date,
              grand_total: o.grand_total,
              from_warehouse: o.from_warehouse,
              to_warehouse: o.to_warehouse,
              vehicle_arrivals: o.vehicle_arrivals,
              created_at: o.created_at,
            })),
            pagination: {
              page: 1,
              page_size: 20,
              total_items: orders.length,
              total_pages: 1,
              has_next: false,
              has_prev: false,
            },
          }),
        });
      }
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...((body as Record<string, unknown>) ?? {}) }),
    });
  });

  // The ASN dialog fetches both "all" and "assigned" warehouse lists when open.
  await page.route('**/api/v1/warehouses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        warehouses: E2E_WAREHOUSES,
        pagination: {
          page: 1,
          page_size: 100,
          total_items: E2E_WAREHOUSES.length,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      }),
    });
  });

  return { calls };
}

/** Seed auth, mock the ASN + warehouse APIs, and open the ASN view. */
export async function openAsn(page: Page, orders: E2EAsnOrder[]): Promise<AsnApiTracker> {
  await seedAuth(page);
  const tracker = await mockAsnApi(page, orders);
  await page.goto('/');
  await page.getByRole('button', { name: 'Stock' }).click();
  await page.getByRole('tab', { name: /Advance Stock Notice/ }).click();
  await page.getByText(orders[0].asn_order_no).first().waitFor({ state: 'visible' });
  return tracker;
}
