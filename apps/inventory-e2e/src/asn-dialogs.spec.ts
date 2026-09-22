import { test, expect } from '@playwright/test';

import { makeAsnOrder, openAsn } from './helpers/asn';

test.describe('ASN order dialogs', () => {
  test('view dialog opens with DetailDialog layout and shows all sections', async ({ page }) => {
    await openAsn(page, [makeAsnOrder({ status: 'confirmed' })]);

    const row = page.locator('tr', { hasText: 'ASN-2026-00001' });
    await row.locator('button').first().click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    // Dialog opens in view mode with the frozen header title
    await expect(page.getByRole('heading', { name: /View ASN Order/ })).toBeVisible();

    // Scrollable body sections
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Line Items' }).first()).toBeVisible();

    // Read-only field values
    await expect(page.getByLabel(/ASN Order #/)).toHaveValue('ASN-2026-00001');
    await expect(page.getByLabel(/Remarks/)).toHaveValue('Urgent shipment');

    // View mode footer has Close, not a submit button
    await expect(page.getByRole('button', { name: 'Close' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update ASN Order' })).toHaveCount(0);
  });

  test('edit dialog opens with editable fields and Update button', async ({ page }) => {
    await openAsn(page, [makeAsnOrder({ status: 'draft' })]);

    const row = page.locator('tr', { hasText: 'ASN-2026-00001' });
    await row.locator('button').first().click();
    await page.getByRole('menuitem', { name: 'Edit Order' }).click();

    await expect(page.getByRole('heading', { name: /Edit ASN Order/ })).toBeVisible();
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update ASN Order' })).toBeVisible();
  });
});
