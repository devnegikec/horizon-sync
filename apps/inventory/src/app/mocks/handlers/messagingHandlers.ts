import { http, HttpResponse } from "msw";
import { messageTemplates, scheduledMessages, deliveryReports } from "../data/messaging";
import { resolveTenant, paginate } from "../utils";

const BASE = "/api/v1";

export const messagingHandlers = [
  // List templates
  http.get(`${BASE}/message-templates`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const channel = url.searchParams.get("channel");

    let filtered = messageTemplates.filter((t) => t.tenant_id === tenantId);
    if (channel) filtered = filtered.filter((t) => t.channel === channel);

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Get single template
  http.get(`${BASE}/message-templates/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const tmpl = messageTemplates.find((t) => t.id === params.id && t.tenant_id === tenantId);
    if (!tmpl) return HttpResponse.json({ detail: "Template not found" }, { status: 404 });
    return HttpResponse.json(tmpl);
  }),

  // Create template
  http.post(`${BASE}/message-templates`, async ({ request }) => {
    const tenantId = resolveTenant(request);
    const body = await request.json() as Record<string, any>;

    // DLT validation for SMS
    if (body.channel === "sms" && (!body.dlt_template_id || !body.dlt_principal_entity_id)) {
      return HttpResponse.json(
        { detail: "dlt_template_id and dlt_principal_entity_id are required for SMS templates" },
        { status: 422 }
      );
    }

    const newTemplate = {
      id: `tmpl-${Date.now()}`,
      tenant_id: tenantId,
      status: "pending",
      created_at: new Date().toISOString(),
      ...body,
    };
    messageTemplates.push(newTemplate as any);
    return HttpResponse.json(newTemplate, { status: 201 });
  }),

  // Update template
  http.patch(`${BASE}/message-templates/:id`, async ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const idx = messageTemplates.findIndex((t) => t.id === params.id && t.tenant_id === tenantId);
    if (idx === -1) return HttpResponse.json({ detail: "Template not found" }, { status: 404 });
    const body = await request.json() as Record<string, any>;
    messageTemplates[idx] = { ...messageTemplates[idx], ...body };
    return HttpResponse.json(messageTemplates[idx]);
  }),

  // Delete template
  http.delete(`${BASE}/message-templates/:id`, ({ params, request }) => {
    const tenantId = resolveTenant(request);
    const idx = messageTemplates.findIndex((t) => t.id === params.id && t.tenant_id === tenantId);
    if (idx === -1) return HttpResponse.json({ detail: "Template not found" }, { status: 404 });
    messageTemplates.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // List scheduled messages
  http.get(`${BASE}/scheduled-messages`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const filtered = scheduledMessages.filter((s) => s.tenant_id === tenantId);
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Create scheduled message (bulk send)
  http.post(`${BASE}/scheduled-messages`, async ({ request }) => {
    const tenantId = resolveTenant(request);
    const body = await request.json() as Record<string, any>;
    const newJob = {
      id: `sched-${Date.now()}`,
      tenant_id: tenantId,
      status: "pending",
      sent_count: 0,
      failed_count: 0,
      created_at: new Date().toISOString(),
      completed_at: null,
      ...body,
    };
    scheduledMessages.push(newJob as any);
    return HttpResponse.json(newJob, { status: 201 });
  }),

  // Delivery reports
  http.get(`${BASE}/delivery-reports`, ({ request }) => {
    const tenantId = resolveTenant(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const schedId = url.searchParams.get("scheduled_message_id");

    let filtered = deliveryReports.filter((r) => r.tenant_id === tenantId);
    if (schedId) filtered = filtered.filter((r) => r.scheduled_message_id === schedId);

    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  // Send WhatsApp (direct)
  http.post(`${BASE}/whatsapp_post`, async ({ request }) => {
    const body = await request.json() as Record<string, any>;
    return HttpResponse.json({ status: "queued", message_id: `wa-${Date.now()}`, recipient: body.to });
  }),

  // Send SMS (direct)
  http.post(`${BASE}/sms_post`, async ({ request }) => {
    const body = await request.json() as Record<string, any>;
    return HttpResponse.json({ status: "queued", message_id: `sms-${Date.now()}`, recipient: body.to });
  }),
];
