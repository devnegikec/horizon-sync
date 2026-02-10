import { http, HttpResponse } from 'msw';

import { UsersResponse, InviteUserResponse } from '../services/user.service';

import { mockSubscriptions } from './data/subscriptions';
import { mockUsers } from './data/users';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

console.log('🔵 MSW: Using API_BASE_URL =', process.env['NX_NODE_ENV']);

export const handlers = [
  // GET /api/v1/users - Get paginated users
  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = mockUsers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(mockUsers.length / pageSize);

    const response: UsersResponse = {
      items: paginatedUsers,
      total: mockUsers.length,
      page,
      page_size: pageSize,
      pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    console.log('🔵 MSW: GET /users', {
      page,
      pageSize,
      totalUsers: mockUsers.length,
      returnedUsers: paginatedUsers.length,
    });

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/v1/users/invite - Invite a new user
  http.post(`${API_BASE_URL}/users/invite`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    console.log('🔵 MSW: POST /users/invite', body);

    // Simulate invitation response
    const response: InviteUserResponse = {
      invitation_id: crypto.randomUUID(),
      email: body.email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      invitation_url: `https://app.horizonsync.com/accept-invitation?token=${crypto.randomUUID()}`,
    };

    // Simulate slight delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/v1/subscriptions/current - Get current subscriptions
  http.get(`${API_BASE_URL}/subscriptions/current`, () => {
    console.log('🔵 MSW: GET /subscriptions/current');
    return HttpResponse.json(mockSubscriptions, { status: 200 });
  }),

  // POST /api/v1/subscriptions - Create new subscription
  http.post(`${API_BASE_URL}/subscriptions`, async ({ request }) => {
    const body = (await request.json()) as { plan_code: string; billing_cycle: string };
    console.log('🔵 MSW: POST /subscriptions', body);

    // Create a new subscription based on the request
    const newSubscription = {
      ...mockSubscriptions[0],
      id: crypto.randomUUID(),
      status: 'active',
      plan: {
        id: crypto.randomUUID(),
        name: body.plan_code === 'pro' ? 'Professional Plan' : 'Basic Plan',
        code: body.plan_code,
        plan_type: body.plan_code,
      },
      billing_cycle: body.billing_cycle,
      starts_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json(newSubscription, { status: 201 });
  }),

  // POST /api/v1/identity/login - Login endpoint (supports remember_me for cookie behaviour)
  http.post(`${API_BASE_URL}/identity/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password?: string; remember_me?: boolean };
    console.log('🔵 MSW: POST /identity/login', body);

    const response = {
      user: {
        ...mockUsers[0],
        email: body.email,
      },
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      user_id: mockUsers[0].id,
      email: body.email,
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Login successful',
    };

    await new Promise((resolve) => setTimeout(resolve, 300));

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/v1/identity/refresh - Refresh access token (cookie-based refresh in production)
  http.post(`${API_BASE_URL}/identity/refresh`, async () => {
    console.log('🔵 MSW: POST /identity/refresh');
    const response = {
      access_token: 'mock_access_token_' + Date.now(),
      token_type: 'Bearer',
      user: mockUsers[0],
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/v1/auth/register - Register endpoint
  http.post(`${API_BASE_URL}/identity/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; first_name: string; last_name: string };
    console.log('🔵 MSW: POST /auth/register', body);

    const response = {
      user: {
        id: crypto.randomUUID(),
        email: body.email,
        first_name: body.first_name || 'Mock',
        last_name: body.last_name || 'User',
        phone: '1234567890',
        display_name: `${body.first_name || 'Mock'} ${body.last_name || 'User'}`,
        user_type: 'individual',
        status: 'active',
        email_verified: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
      },
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    return HttpResponse.json(response, { status: 201 });
  }),
];
