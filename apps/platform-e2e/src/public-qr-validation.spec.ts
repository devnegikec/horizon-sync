import { test, expect, type Page } from '@playwright/test';

const gtin = '0123456789012';
const serial = 'PRO-ABC12345';
const timestamp = '1770000000000';
const qrPath = `/g/${gtin}/s/${serial}/${timestamp}?c=signed-value`;

const baseResult = {
  verification_status: 'authentic',
  authentic: true,
  message: 'This product is genuine and verified.',
  requires_action: false,
  challenge_type: null,
  product_name: 'Demo Product',
  generic_name: 'Demo Generic',
  brand_name: 'Demo Brand',
  sku_name: 'Blue / Large',
  sku_code: 'DEMO-BLU-L',
  variant_attributes: { Colour: 'Blue', Size: 'Large' },
  gtin,
  serial_number: serial,
  qr_type: 'dynamic',
  qr_channel: null,
  activation_method: 'pre',
  industry: 'Consumer Goods',
  warranty_period_months: 18,
  batch_number: 'BATCH-2026-01',
  manufacturing_date: '2026-01-10',
  expiry_date: '2027-01-10',
  logo_url: null,
  product_image_url: null,
  banner_image_url: null,
  contact_email: 'support@example.com',
  contact_phone: null,
  website_url: 'https://example.com/product',
};

async function mockPublicApis(page: Page, verify: (payload: Record<string, unknown>) => Record<string, unknown>) {
  await page.route('**/api/v1/public/qr/verify', async (route) => {
    const payload = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(verify(payload)),
    });
  });

  await page.route('**/api/v1/public/products/sku/**/landing-page', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'No landing page config exists for this product' }),
    });
  });
}

test.describe('Public QSeal QR validation', () => {
  test('verifies a Dynamic QR through the public URL', async ({ page }) => {
    await mockPublicApis(page, () => baseResult);

    await page.goto(qrPath);

    await expect(page.getByRole('heading', { name: 'Authentic Product' })).toBeVisible();
    await expect(page.getByText('Dynamic QR')).toBeVisible();
    await expect(page.getByText('BATCH-2026-01')).toBeVisible();
  });

  test('requires the protected layer for a Dual overt QR', async ({ page }) => {
    await mockPublicApis(page, () => ({
      ...baseResult,
      verification_status: 'verification_required',
      authentic: false,
      requires_action: true,
      challenge_type: 'scan_covert',
      qr_type: 'dual',
      qr_channel: 'overt',
      message: 'Scan the protected QR code to complete product verification.',
    }));

    await page.goto(`${qrPath}&qr=overt`);

    await expect(page.getByRole('heading', { name: 'Complete Verification' })).toBeVisible();
    await expect(page.getByText('Scan the protected QR')).toBeVisible();
    await expect(page.getByText('overt layer')).toBeVisible();
  });

  test('shows the consumed state after a One-Time QR is replayed', async ({ page }) => {
    let used = false;
    await mockPublicApis(page, () => {
      if (used) {
        return {
          ...baseResult,
          verification_status: 'already_used',
          authentic: false,
          qr_type: 'one_time',
          message: 'This One-Time QR code has already been used.',
        };
      }
      used = true;
      return { ...baseResult, qr_type: 'one_time' };
    });

    await page.goto(qrPath);
    await expect(page.getByRole('heading', { name: 'Authentic Product' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Code Already Used' })).toBeVisible();
    await expect(page.getByText('One-Time QR')).toBeVisible();
  });

  test('submits the protected code for a Secure QR', async ({ page }) => {
    await mockPublicApis(page, (payload) => {
      if (payload.secure_code) return { ...baseResult, qr_type: 'secure_code' };
      return {
        ...baseResult,
        verification_status: 'verification_required',
        authentic: false,
        requires_action: true,
        challenge_type: 'secure_code',
        qr_type: 'secure_code',
        message: 'Enter the protected code to verify this product.',
      };
    });

    await page.goto(qrPath);
    await page.getByLabel('Protected product code').fill('a1b2c3d4e5f6');
    await page.getByRole('button', { name: 'Verify code' }).click();

    await expect(page.getByRole('heading', { name: 'Authentic Product' })).toBeVisible();
    await expect(page.getByText('Secure Code')).toBeVisible();
  });
});
