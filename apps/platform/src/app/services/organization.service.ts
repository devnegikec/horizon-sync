import { environment } from '../../environments/environment';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  display_name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  organization_type: string;
  industry: string;
  status: string;
  settings?: Record<string, unknown>;
  extra_data?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  organization_type: string;
  industry: string;
  status: string;
  settings?: Record<string, unknown>;
  extra_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  display_name?: string | null;
  settings?: Record<string, unknown>;
}

const API_BASE_URL = environment.apiBaseUrl;

export class OrganizationService {
  static async createOrganization(payload: CreateOrganizationPayload, token: string): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({
          message: 'Failed to create organization',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating organization');
    }
  }

  static async getOrganization(organizationId: string, token: string): Promise<Organization> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/organizations/${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({
          message: 'Failed to fetch organization',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching organization');
    }
  }

  static async updateOrganization(
    organizationId: string,
    payload: UpdateOrganizationPayload,
    token: string
  ): Promise<Organization> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({
          message: 'Failed to update organization',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating organization');
    }
  }
}
