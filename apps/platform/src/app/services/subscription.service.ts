import { environment } from '../../environments/environment';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  plan_type: string;
}

export interface SubscriptionUsage {
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

export interface Subscription {
  id: string;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';
  plan: SubscriptionPlan;
  billing_cycle: 'monthly' | 'yearly';
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  starts_at: string;
  ends_at: string | null;
  next_billing_date: string;
  current_usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  features: string[];
}

export interface CreateSubscriptionPayload {
  plan_code: string;
  billing_cycle: 'monthly' | 'yearly';
}

const API_BASE_URL = environment.apiBaseUrl;

export class SubscriptionService {
  static async getCurrentSubscriptions(token: string): Promise<Subscription[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to fetch subscriptions',
        }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: Subscription[] = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching subscriptions');
    }
  }

  static async createSubscription(
    payload: CreateSubscriptionPayload,
    token: string
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to create subscription',
        }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data: Subscription = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating subscription');
    }
  }
}
