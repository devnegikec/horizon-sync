import { http, HttpResponse } from "msw";
import { users, mockTokens, tokenPayloads } from "../data/auth";

const BASE = "/api/v1";

export const authHandlers = [
  // Login
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    const user = users.find((u) => u.email === body.email);

    if (!user || body.password !== "password123") {
      return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const token = mockTokens[user.email];
    return HttpResponse.json({ token, user });
  }),

  // Logout
  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ detail: "Logged out successfully" });
  }),

  // Send email OTP
  http.post(`${BASE}/sent-otp`, async ({ request }) => {
    const body = await request.json() as { email: string };
    return HttpResponse.json({ detail: `OTP sent to ${body.email}` });
  }),

  // Verify email OTP
  http.post(`${BASE}/otp`, async ({ request }) => {
    const body = await request.json() as { email: string; otp: string };
    if (body.otp === "123456") {
      return HttpResponse.json({ detail: "OTP verified" });
    }
    return HttpResponse.json({ detail: "Invalid OTP" }, { status: 400 });
  }),

  // Send mobile OTP
  http.post(`${BASE}/send_mobileotp`, async ({ request }) => {
    const body = await request.json() as { mobile: string };
    return HttpResponse.json({ detail: `OTP sent to ${body.mobile}` });
  }),

  // Verify mobile OTP
  http.post(`${BASE}/verify_mobileotp`, async ({ request }) => {
    const body = await request.json() as { mobile: string; otp: string };
    if (body.otp === "123456") {
      return HttpResponse.json({ detail: "Mobile OTP verified" });
    }
    return HttpResponse.json({ detail: "Invalid OTP" }, { status: 400 });
  }),

  // Get current user (me)
  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    const payload = tokenPayloads[token] as any;
    if (!payload) return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const user = users.find((u) => u.id === payload.sub);
    return HttpResponse.json(user);
  }),
];
