import { http, HttpResponse } from "msw";
import { products, distributionChannels, destinationChannels } from "../data/products";
import { blocks } from "../data/blocks";
import { organizations } from "../data/organizations";
import { resolveTenant, paginate } from "../utils";

const BASE = "/api/v1";

export const productHandlers = [
  // List products
  http.get(`${BASE}/products`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);

    const filtered = products.filter((p) => p.tenant_id === tenantId);
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Get single product
  http.get(`${BASE}/products/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const product = products.find((p) => p.id === params.id && p.tenant_id === tenantId);
    if (!product) return HttpResponse.json({ detail: "Product not found" }, { status: 404 });
    return HttpResponse.json(product);
  }),

  // Create product
  http.post(`${BASE}/products`, async ({ request }) => {
    const tenantId = resolveTenant(request);
    const body = await request.json() as Record<string, any>;
    const newProduct = {
      id: `prod-${Date.now()}`,
      tenant_id: tenantId,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    };
    products.push(newProduct as any);
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  // Update product
  http.patch(`${BASE}/products/:id`, async ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const idx = products.findIndex((p) => p.id === params.id && p.tenant_id === tenantId);
    if (idx === -1) return HttpResponse.json({ detail: "Product not found" }, { status: 404 });
    const body = await request.json() as Record<string, any>;
    products[idx] = { ...products[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(products[idx]);
  }),

  // Delete product
  http.delete(`${BASE}/products/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const idx = products.findIndex((p) => p.id === params.id && p.tenant_id === tenantId);
    if (idx === -1) return HttpResponse.json({ detail: "Product not found" }, { status: 404 });
    products.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Distribution channels
  http.get(`${BASE}/distribution-channels`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const filtered = distributionChannels.filter((d) => d.tenant_id === tenantId);
    return HttpResponse.json({ items: filtered, pagination: { page: 1, page_size: 20, total_items: filtered.length, total_pages: 1, has_next: false, has_prev: false } });
  }),

  // Destination channels
  http.get(`${BASE}/destination-channels`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const filtered = destinationChannels.filter((d) => d.tenant_id === tenantId);
    return HttpResponse.json({ items: filtered, pagination: { page: 1, page_size: 20, total_items: filtered.length, total_pages: 1, has_next: false, has_prev: false } });
  }),

  // List blocks for a product
  http.get(`${BASE}/products/:id/blocks`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const filtered = blocks.filter((b) => b.product_id === params.id && b.tenant_id === tenantId);
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Create block (QR generation)
  http.post(`${BASE}/products/:id/blocks`, async ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const org = organizations.find((o) => o.tenant_id === tenantId);
    const body = await request.json() as Record<string, any>;

    if (org && org.qr_credits_used + body.quantity > org.qr_credit_limit) {
      return HttpResponse.json({ detail: "Insufficient QR credits" }, { status: 422 });
    }

    const newBlock = {
      id: `block-${Date.now()}`,
      tenant_id: tenantId,
      product_id: params.id,
      status: "processing",
      generated_at: null,
      download_url: null,
      qr_items_count: 0,
      credits_used: body.quantity,
      created_at: new Date().toISOString(),
      ...body,
    };
    blocks.push(newBlock as any);
    if (org) org.qr_credits_used += body.quantity;

    // Simulate async completion after a short delay (MSW can't truly async, so return processing)
    return HttpResponse.json(newBlock, { status: 201 });
  }),

  // QR credits for org
  http.get(`${BASE}/organizations/credits`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const org = organizations.find((o) => o.tenant_id === tenantId);
    if (!org) return HttpResponse.json({ detail: "Organization not found" }, { status: 404 });
    return HttpResponse.json({
      qr_credit_limit: org.qr_credit_limit,
      qr_credits_used: org.qr_credits_used,
      qr_credits_remaining: org.qr_credit_limit - org.qr_credits_used,
    });
  }),

  // Authenticate product (consumer scan)
  http.post(`${BASE}/authentication`, async ({ request }) => {
    const body = await request.json() as { serial_number: string };
    const isAuthentic = !body.serial_number.includes("FAKE");
    return HttpResponse.json({
      is_authentic: isAuthentic,
      message: isAuthentic ? "Product is authentic" : "Product could not be verified",
      product_name: isAuthentic ? "Paracetamol 500mg" : null,
      redirect_url: isAuthentic ? null : null,
    });
  }),
];
