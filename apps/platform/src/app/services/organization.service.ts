import { environment } from '../../environments/environment';

function getFriendlyMessage(status: number): string {
  switch (status) {
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 422: return 'The submitted data is invalid. Please check your input.';
    case 500: return 'An unexpected server error occurred. Please try again later.';
    case 502: case 503: case 504: return 'The service is temporarily unavailable. Please try again in a few moments.';
    default: return 'Something went wrong. Please try again later.';
  }
}

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
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/organizations`, {
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
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
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
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/organizations/${organizationId}`, {
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
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
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
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/organizations/${organizationId}`, {
        method: 'PATCH',
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
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
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
