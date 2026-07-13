import { http, HttpResponse } from "msw";
import { warranties, warrantyPeriods } from "../data/warranty";
import { resolveTenant, paginate } from "../utils";

const BASE = "/api/v1";

export const warrantyHandlers = [
  // List warranties
  http.get(`${BASE}/warranties`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const filtered = warranties.filter((w) => w.tenant_id === tenantId);
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Check warranty by serial number
  http.get(`${BASE}/warranty-check`, ({ request }) => {
    const url = new URL(request.url);
    const serial = url.searchParams.get("serial_number");
    if (!serial) return HttpResponse.json({ detail: "serial_number is required" }, { status: 400 });

    const warranty = warranties.find((w) => w.serial_number === serial);
    if (!warranty) return HttpResponse.json({ detail: "No warranty found for this serial number" }, { status: 404 });

    const isActive = new Date(warranty.expiry_date) > new Date();
    return HttpResponse.json({ ...warranty, is_active: isActive });
  }),

  // Search warranties
  http.get(`${BASE}/warranty-search`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.toLowerCase() ?? "";
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);

    const filtered = warranties.filter(
      (w) =>
        w.tenant_id === tenantId &&
        (w.serial_number.toLowerCase().includes(query) ||
          w.customer_name.toLowerCase().includes(query) ||
          w.mobile.includes(query))
    );
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Register warranty
  http.post(`${BASE}/warranty`, async ({ request }) => {
    const tenantId = resolveTenant(request);
    const body = await request.json() as Record<string, any>;

    // Find warranty period for product
    const period = warrantyPeriods.find(
      (wp) => wp.tenant_id === tenantId && wp.product_id === body.product_id && wp.is_default
    );
    const months = period?.months ?? 12;
    const purchaseDate = new Date(body.purchase_date);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const newWarranty = {
      id: `warr-${Date.now()}`,
      tenant_id: tenantId,
      status: "active",
      expiry_date: expiryDate.toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      ...body,
    };
    warranties.push(newWarranty as any);
    return HttpResponse.json(newWarranty, { status: 201 });
  }),

  // Warranty periods
  http.get(`${BASE}/warranty-periods`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const filtered = warrantyPeriods.filter((wp) => wp.tenant_id === tenantId);
    return HttpResponse.json({ items: filtered });
  }),
];
