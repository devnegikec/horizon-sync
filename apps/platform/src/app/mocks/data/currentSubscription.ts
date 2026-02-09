export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  plan_type: string;
}

export interface CurrentUsage {
  users: number;
  teams: number;
  storage_mb: number;
}

export interface SubscriptionLimits {
  max_users: number;
  max_teams: number;
  max_leads: number;
  max_contacts: number;
  max_deals: number;
  max_tickets: number;
  max_products: number;
  max_storage_gb: number;
}

export interface CurrentSubscription {
  id: string;
  status: string;
  plan: SubscriptionPlan;
  billing_cycle: string;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  next_billing_date: string | null;
  current_usage: CurrentUsage;
  limits: SubscriptionLimits;
  features: string[];
}

export const mockCurrentSubscriptions: CurrentSubscription[] = [
  {
    id: '7f8b9c0d-1a2b-3c4d-5e6f-7g8h9i0j1k2l',
    status: 'active',
    plan: {
      id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      name: 'Professional Plan',
      code: 'pro',
      plan_type: 'pro',
    },
    billing_cycle: 'monthly',
    trial_starts_at: null,
    trial_ends_at: null,
    starts_at: '2025-12-01T08:00:00Z',
    ends_at: '2026-12-01T08:00:00Z',
    next_billing_date: '2026-02-01T08:00:00Z',
    current_usage: {
      users: 12,
      teams: 4,
      storage_mb: 5120.0,
    },
    limits: {
      max_users: 50,
      max_teams: 10,
      max_leads: 5000,
      max_contacts: 10000,
      max_deals: 1000,
      max_tickets: 500,
      max_products: 200,
      max_storage_gb: 50,
    },
    features: ['crm', 'inventory', 'support', 'api_access'],
  },
  {
    id: '8g9h0i1j-2k3l-4m5n-6o7p-8q9r0s1t2u3v',
    status: 'trial',
    plan: {
      id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
      name: 'Basic Plan',
      code: 'basic',
      plan_type: 'basic',
    },
    billing_cycle: 'monthly',
    trial_starts_at: '2026-01-15T10:00:00Z',
    trial_ends_at: '2026-01-30T10:00:00Z',
    starts_at: '2026-01-15T10:00:00Z',
    ends_at: null,
    next_billing_date: '2026-01-30T10:00:00Z',
    current_usage: {
      users: 2,
      teams: 1,
      storage_mb: 1024.0,
    },
    limits: {
      max_users: 5,
      max_teams: 2,
      max_leads: 500,
      max_contacts: 1000,
      max_deals: 100,
      max_tickets: 50,
      max_products: 20,
      max_storage_gb: 5,
    },
    features: ['crm', 'inventory'],
  },
];
