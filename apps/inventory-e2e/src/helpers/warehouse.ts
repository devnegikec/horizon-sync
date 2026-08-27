import { Page } from '@playwright/test';

/** Minimal warehouse shape used to seed the mocked warehouse API. */
export interface E2EWarehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_warehouse_id?: string | null;
  parent?: { id: string; code: string; name: string } | null;
  warehouse_type: 'warehouse' | 'store' | 'transit';
  address_line1?: string;
  address_line2?: string;
  city?: string | null;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  total_capacity?: number;
  capacity_uom?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export function makeWarehouse(overrides: Partial<E2EWarehouse> = {}): E2EWarehouse {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Main Warehouse',
    code: 'WH-001',
    description: 'Primary distribution center',
    parent_warehouse_id: null,
    parent: null,
    warehouse_type: 'warehouse',
    address_line1: '123 Industrial Ave',
    address_line2: 'Unit 5',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'India',
    contact_name: 'Ravi Kumar',
    contact_phone: '+91-9000000000',
    contact_email: 'ravi@example.com',
    total_capacity: 5000,
    capacity_uom: 'sqft',
    is_active: true,
    is_default: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

/**
 * Seed the persisted zustand auth store (`horizon-auth`) before the app boots.
 * `accessToken` is normally in-memory only, but zustand's persist `merge` will
 * pick up any keys we write here, so we can inject it for e2e.
 */
export async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      user: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'e2e@example.com',
        first_name: 'E2E',
        last_name: 'User',
        phone: '+0000000000',
      },
      organization: {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'E2E Org',
        display_name: 'E2E Org',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      accessToken: 'e2e-access-token',
      refreshToken: 'e2e-refresh-token',
      isAuthenticated: true,
    };
    localStorage.setItem('horizon-auth', JSON.stringify({ state, version: 0 }));
  });
}

export interface WarehouseApiTracker {
  calls: Array<{ method: string; url: string; body: unknown }>;
}

/**
 * Mock the warehouse list / create / update endpoints and record all calls.
 * The warehouse view only needs the list endpoint; edit/create hit PUT/POST.
 */
export async function mockWarehouseApi(page: Page, warehouses: E2EWarehouse[]): Promise<WarehouseApiTracker> {
  const calls: WarehouseApiTracker['calls'] = [];

  await page.route('**/api/v1/warehouses**', async (route) => {
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          warehouses,
          pagination: {
            page: 1,
            page_size: 20,
            total_items: warehouses.length,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
          status_counts: {
            active: warehouses.filter((w) => w.is_active).length,
            inactive: warehouses.filter((w) => !w.is_active).length,
          },
          type_counts: {
            warehouse: warehouses.filter((w) => w.warehouse_type === 'warehouse').length,
            store: warehouses.filter((w) => w.warehouse_type === 'store').length,
            transit: warehouses.filter((w) => w.warehouse_type === 'transit').length,
          },
        }),
      });
      return;
    }

    if (method === 'PUT' || method === 'POST') {
      const id = url.split('/').pop();
      const existing = warehouses.find((w) => w.id === id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...(existing ?? {}), ...(body as Record<string, unknown>) }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return { calls };
}

/** Seed auth, mock the API, and open the Warehouses view. */
export async function openWarehouses(page: Page, warehouses: E2EWarehouse[]): Promise<WarehouseApiTracker> {
  await seedAuth(page);
  const tracker = await mockWarehouseApi(page, warehouses);
  await page.goto('/');
  await page.getByRole('button', { name: 'Warehouses' }).click();
  await page.getByText(warehouses[0].name).first().waitFor({ state: 'visible' });
  return tracker;
}
