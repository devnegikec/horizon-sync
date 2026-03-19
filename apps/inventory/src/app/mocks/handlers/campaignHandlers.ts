import { http, HttpResponse } from "msw";
import { campaigns, leads, coupons } from "../data/campaigns";
import { resolveTenant, paginate } from "../utils";

const BASE = "/api/v1";

export const campaignHandlers = [
  // List campaigns
  http.get(`${BASE}/campaigns`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const status = url.searchParams.get("status");

    let filtered = campaigns.filter((c) => c.tenant_id === tenantId);
    if (status) filtered = filtered.filter((c) => c.status === status);

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Get single campaign
  http.get(`${BASE}/campaigns/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const campaign = campaigns.find((c) => c.id === params.id && c.tenant_id === tenantId);
    if (!campaign) return HttpResponse.json({ detail: "Campaign not found" }, { status: 404 });
    return HttpResponse.json(campaign);
  }),

  // Create campaign
  http.post(`${BASE}/campaigns`, async ({ request }) => {
    const tenantId = resolveTenant(request);
    const body = await request.json() as Record<string, any>;
    const newCampaign = {
      id: `camp-${Date.now()}`,
      tenant_id: tenantId,
      status: "draft",
      coupons_issued: 0,
      created_at: new Date().toISOString(),
      ...body,
    };
    campaigns.push(newCampaign as any);
    return HttpResponse.json(newCampaign, { status: 201 });
  }),

  // Update campaign
  http.patch(`${BASE}/campaigns/:id`, async ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const idx = campaigns.findIndex((c) => c.id === params.id && c.tenant_id === tenantId);
    if (idx === -1) return HttpResponse.json({ detail: "Campaign not found" }, { status: 404 });
    const body = await request.json() as Record<string, any>;
    campaigns[idx] = { ...campaigns[idx], ...body };
    return HttpResponse.json(campaigns[idx]);
  }),

  // List leads
  http.get(`${BASE}/leads`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const filtered = leads.filter((l) => l.tenant_id === tenantId);
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Get single lead
  http.get(`${BASE}/leads/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const lead = leads.find((l) => l.id === params.id && l.tenant_id === tenantId);
    if (!lead) return HttpResponse.json({ detail: "Lead not found" }, { status: 404 });
    return HttpResponse.json(lead);
  }),

  // List coupons
  http.get(`${BASE}/coupons`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const campaignId = url.searchParams.get("campaign_id");

    let filtered = coupons.filter((c) => c.tenant_id === tenantId);
    if (campaignId) filtered = filtered.filter((c) => c.campaign_id === campaignId);

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Verify coupon
  http.post(`${BASE}/coupon-verification`, async ({ request }) => {
    const body = await request.json() as { coupon_code: string };
    const coupon = coupons.find((c) => c.coupon_code === body.coupon_code);
    if (!coupon) return HttpResponse.json({ detail: "Coupon not found" }, { status: 404 });
    if (coupon.used) return HttpResponse.json({ detail: "Coupon already redeemed" }, { status: 409 });
    if (new Date(coupon.expiry) < new Date()) return HttpResponse.json({ detail: "Coupon expired" }, { status: 409 });
    return HttpResponse.json({ valid: true, coupon });
  }),

  // Redeem coupon
  http.post(`${BASE}/coupon-redeem`, async ({ request }) => {
    const body = await request.json() as { coupon_code: string; final_billed_amount: number };
    const idx = coupons.findIndex((c) => c.coupon_code === body.coupon_code);
    if (idx === -1) return HttpResponse.json({ detail: "Coupon not found" }, { status: 404 });
    if (coupons[idx].used) return HttpResponse.json({ detail: "Coupon already redeemed" }, { status: 409 });
    coupons[idx] = { ...coupons[idx], used: true, final_billed_amount: body.final_billed_amount };
    return HttpResponse.json({ success: true, coupon: coupons[idx] });
  }),

  // Unlock coupon
  http.post(`${BASE}/coupon-unlock`, async ({ request }) => {
    const body = await request.json() as { coupon_code: string };
    const idx = coupons.findIndex((c) => c.coupon_code === body.coupon_code);
    if (idx === -1) return HttpResponse.json({ detail: "Coupon not found" }, { status: 404 });
    coupons[idx] = {
      ...coupons[idx],
      is_unlocked: true,
      unlock_count: coupons[idx].unlock_count + 1,
    };
    return HttpResponse.json({ success: true, coupon: coupons[idx] });
  }),
];
