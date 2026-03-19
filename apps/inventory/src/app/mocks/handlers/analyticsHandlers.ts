import { http, HttpResponse } from "msw";
import { scanEvents, dashboardMetrics } from "../data/analytics";
import { resolveTenant, paginate } from "../utils";

const BASE = "/api/v1";

export const analyticsHandlers = [
  // Dashboard summary metrics
  http.get(`${BASE}/analytics/dashboard`, ({ request }) => {
    const tenantId = resolveTenant(request);
    return HttpResponse.json({ ...dashboardMetrics, tenant_id: tenantId });
  }),

  // QR scan events list
  http.get(`${BASE}/analytics/scans`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const productId = url.searchParams.get("product_id");

    let filtered = scanEvents.filter((s) => s.tenant_id === tenantId);
    if (productId) filtered = filtered.filter((s) => s.product_id === productId);

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Scans by product
  http.get(`${BASE}/analytics/scans/by-product`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const filtered = scanEvents.filter((s) => s.tenant_id === tenantId);

    const byProduct: Record<string, number> = {};
    filtered.forEach((s) => {
      byProduct[s.product_id] = (byProduct[s.product_id] ?? 0) + 1;
    });

    return HttpResponse.json(
      Object.entries(byProduct).map(([product_id, count]) => ({ product_id, count }))
    );
  }),

  // Scans by date range
  http.get(`${BASE}/analytics/scans/by-date`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const metrics = { ...dashboardMetrics, tenant_id: tenantId };
    return HttpResponse.json(metrics.scans_by_day);
  }),

  // Geographic distribution
  http.get(`${BASE}/analytics/scans/by-location`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const metrics = { ...dashboardMetrics, tenant_id: tenantId };
    return HttpResponse.json(metrics.top_locations);
  }),

  // Device breakdown
  http.get(`${BASE}/analytics/scans/by-device`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const metrics = { ...dashboardMetrics, tenant_id: tenantId };
    return HttpResponse.json(metrics.device_breakdown);
  }),
];
