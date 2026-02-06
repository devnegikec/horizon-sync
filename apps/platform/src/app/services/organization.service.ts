import { environment } from '../../environments/environment';

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
}
