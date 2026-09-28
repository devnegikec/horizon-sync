/**
 * The QR helpers are small but two of them carry a fix worth pinning: the label markup is
 * written into an iframe as raw HTML, and a 50-label print run must not draw every image
 * in one burst.
 */
jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn(async (data: string) => `data:${data}`) },
}));

import type { WarehouseLocation } from '../../types/wms.types';
import { buildQrPayload, escapeHtml, generateQRDataUrls, qrShortCode } from '../locationQrShared';

function location(overrides: Partial<WarehouseLocation> = {}): WarehouseLocation {
  return {
    id: 'loc-1',
    organization_id: 'org-1',
    warehouse_id: 'wh-1',
    parent_location_id: null,
    location_type: 'bin',
    code: 'Z01-A01-B01-L01-BN001',
    full_path: 'Z01-A01-B01-L01-BN001',
    name: null,
    capacity: 10,
    total_capacity: 10,
    available_capacity: 4,
    capacity_uom: 'units',
    position_x: 0,
    position_y: 0,
    is_active: true,
    version: 1,
    qr_code: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('neutralises markup in an authored location code', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes ampersands before the entities it writes', () => {
    expect(escapeHtml('A&B <"\'')).toBe('A&amp;B &lt;&quot;&#39;');
  });
});

describe('qrShortCode', () => {
  it('prefers the printable short code', () => {
    expect(qrShortCode(location({ qr_code: 'K7M2P' }))).toBe('K7M2P');
  });

  it('falls back to the location code when the bin has no short code', () => {
    expect(qrShortCode(location())).toBe('Z01-A01-B01-L01-BN001');
  });
});

describe('buildQrPayload', () => {
  it('carries the location uuid the mobile app resolves', () => {
    const payload = JSON.parse(buildQrPayload(location({ qr_code: 'K7M2P' })));

    expect(payload).toEqual({
      type: 'location',
      location_id: 'loc-1',
      warehouse_id: 'wh-1',
      full_path: 'Z01-A01-B01-L01-BN001',
      location_code: 'Z01-A01-B01-L01-BN001',
      qr_code: 'K7M2P',
    });
  });
});

describe('generateQRDataUrls', () => {
  it('returns one image per payload, in order, across batch boundaries', async () => {
    const payloads = Array.from({ length: 23 }, (_, index) => `P${index}`);

    const dataUrls = await generateQRDataUrls(payloads);

    expect(dataUrls).toEqual(payloads.map((payload) => `data:${payload}`));
  });
});
