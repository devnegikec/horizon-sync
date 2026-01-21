import { http, HttpResponse } from 'msw';
import { mockUsers } from './data/users';
import { mockSubscriptions } from './data/subscriptions';
import { UsersResponse, InviteUserResponse } from '../services/user.service';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001/api/v1';

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
    const body = await request.json();
    console.log('🔵 MSW: POST /users/invite', body);

    // Simulate invitation response
    const response: InviteUserResponse = {
      invitation_id: crypto.randomUUID(),
      email: (body as any).email,
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
    const body = await request.json();
    console.log('🔵 MSW: POST /subscriptions', body);
    
    // Create a new subscription based on the request
    const newSubscription = {
      ...mockSubscriptions[0],
      id: crypto.randomUUID(),
      status: 'active',
      plan: {
        id: crypto.randomUUID(),
        name: (body as any).plan_code === 'pro' ? 'Professional Plan' : 'Basic Plan',
        code: (body as any).plan_code,
        plan_type: (body as any).plan_code,
      },
      billing_cycle: (body as any).billing_cycle,
      starts_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newSubscription, { status: 201 });
  }),

  // POST /api/v1/auth/login - Login endpoint
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    console.log('🔵 MSW: POST /auth/login', body);

    const response = {
      access_token: 'mock_access_token_' + Date.now(),
      token_type: 'Bearer',
      user_id: mockUsers[0].id,
      email: (body as any).email,
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      message: 'Login successful',
    };

    await new Promise((resolve) => setTimeout(resolve, 300));

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /api/v1/auth/register - Register endpoint
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();
    console.log('🔵 MSW: POST /auth/register', body);

    const response = {
      user_id: crypto.randomUUID(),
      email: (body as any).email,
      organization_id: crypto.randomUUID(),
      message: 'User registered successfully',
    };

    await new Promise((resolve) => setTimeout(resolve, 500));

    return HttpResponse.json(response, { status: 201 });
  }),
];
