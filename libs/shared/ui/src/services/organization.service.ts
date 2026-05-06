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

export interface UpdateOrganizationPayload {
  name?: string;
  display_name?: string | null;
  settings?: Record<string, unknown>;
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

/**
 * Organization Service
 *
 * Note: This service accepts `token` and `apiBaseUrl` as parameters because
 * it lives in the shared UI library which doesn't have direct access to the
 * platform app's environment config or Zustand store. Callers in the platform
 * app should pass `getAccessToken()` and `environment.apiBaseUrl`.
 */
export class OrganizationService {
  static async createOrganization(
    payload: CreateOrganizationPayload,
    token: string,
    apiBaseUrl: string
  ): Promise<unknown> {
    const response = await fetch(`${apiBaseUrl}/api/v1/identity/organizations`, {
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

    return response.json();
  }

  static async updateOrganization(
    organizationId: string,
    payload: UpdateOrganizationPayload,
    token: string,
    apiBaseUrl: string
  ): Promise<Organization> {
    const response = await fetch(`${apiBaseUrl}/api/v1/identity/organizations/${organizationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Failed to update organization',
      }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}
