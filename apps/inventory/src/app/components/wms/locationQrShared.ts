/**
 * QR payload and image helpers shared by the Location QR panel and its columns.
 *
 * The mobile app (BWmobile) accepts either a 5-char short code or a JSON payload of shape
 * `{ type: "location", location_id, ... }`. Floor-plan generated bins have no 5-char
 * `qr_code` (their `code` is a dashed path like "L01-BN01"), so the QR must carry the JSON
 * payload with the location UUID — otherwise scanning fails with "Invalid Code".
 *
 * Split out of the panel so the column factory can build a cell image without importing
 * the component that mounts the table.
 */
import QRCode from 'qrcode';

import type { WarehouseLocation } from '../../types/wms.types';

/** The code shown next to the QR: the printable short code when the bin has one. */
export function qrShortCode(loc: WarehouseLocation): string {
  return loc.qr_code || loc.code;
}

/** The JSON payload encoded inside each bin QR. */
export function buildQrPayload(loc: WarehouseLocation): string {
  return JSON.stringify({
    type: 'location',
    location_id: loc.id,
    warehouse_id: loc.warehouse_id,
    full_path: loc.full_path || loc.code,
    location_code: loc.code,
    qr_code: loc.qr_code || loc.code,
  });
}

export async function generateQRDataUrl(data: string, size = 200): Promise<string> {
  return QRCode.toDataURL(data, { width: size, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
}

/** How many QR images to draw before handing the main thread back to the browser. */
const QR_BATCH_SIZE = 10;

/**
 * One data URL per payload, drawn a few at a time.
 *
 * `QRCode.toDataURL` does its drawing synchronously before the promise settles, so a
 * whole print run through `Promise.all` is one unbroken burst of work that freezes the
 * tab. Batching yields between chunks, which costs nothing and keeps the run responsive.
 */
export async function generateQRDataUrls(payloads: string[], size = 200): Promise<string[]> {
  const dataUrls: string[] = [];

  for (let index = 0; index < payloads.length; index += QR_BATCH_SIZE) {
    const batch = payloads.slice(index, index + QR_BATCH_SIZE);
    dataUrls.push(...(await Promise.all(batch.map((payload) => generateQRDataUrl(payload, size)))));
    if (index + QR_BATCH_SIZE < payloads.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return dataUrls;
}

/**
 * Escape a value for interpolation into the print document's markup.
 *
 * Location codes are authored - an imported layout document may carry any string - and
 * the label markup is written into an iframe with `document.write`, so an unescaped code
 * is stored cross-site scripting, not just a broken label.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
