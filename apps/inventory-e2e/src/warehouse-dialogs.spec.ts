import { test, expect } from '@playwright/test';

import { makeWarehouse, openWarehouses } from './helpers/warehouse';

test.describe('Warehouse dialogs', () => {
  test('view dialog shows all detail sections read-only', async ({ page }) => {
    await openWarehouses(page, [makeWarehouse()]);

    const row = page.locator('tr', { hasText: 'Main Warehouse' });
    await row.locator('button').first().click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    // All sections mirroring the edit dialog should be visible
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Address Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contact Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Capacity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Timestamps' })).toBeVisible();

    // Spot-check field labels present in the edit dialog
    await expect(page.getByText('Warehouse Code')).toBeVisible();
    await expect(page.getByText('Address Line 1')).toBeVisible();
    await expect(page.getByText('Contact Name')).toBeVisible();
    await expect(page.getByText('Total Capacity')).toBeVisible();

    // It is a view — no edit/save controls
    await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);
  });

  test('edit dialog opens with all fields and prefilled values', async ({ page }) => {
    await openWarehouses(page, [makeWarehouse()]);

    const row = page.locator('tr', { hasText: 'Main Warehouse' });
    await row.locator('button').first().click();
    await page.getByRole('menuitem', { name: 'Edit Warehouse' }).click();

    await expect(page.getByRole('heading', { name: /Edit Warehouse/ })).toBeVisible();
    await expect(page.getByLabel(/Warehouse Name/)).toHaveValue('Main Warehouse');
    await expect(page.getByLabel(/Address Line 1/)).toHaveValue('123 Industrial Ave');
    await expect(page.getByLabel('Email')).toHaveValue('ravi@example.com');
    await expect(page.getByLabel(/Total Capacity/)).toHaveValue('5000');
  });

  test('edit dialog saves the updated name and closes', async ({ page }) => {
    const tracker = await openWarehouses(page, [makeWarehouse()]);

    const row = page.locator('tr', { hasText: 'Main Warehouse' });
    await row.locator('button').first().click();
    await page.getByRole('menuitem', { name: 'Edit Warehouse' }).click();

    await page.getByLabel(/Warehouse Name/).fill('Updated Warehouse');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Dialog closes after a successful save
    await expect(page.getByRole('heading', { name: /Edit Warehouse/ })).toBeHidden({ timeout: 5000 });

    // The PUT request carried the updated name
    const putCall = tracker.calls.find((c) => c.method === 'PUT');
    expect(putCall).toBeTruthy();
    expect((putCall?.body as { name?: string })?.name).toBe('Updated Warehouse');
  });
});
