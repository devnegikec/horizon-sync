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
  settings?: Record<string, any>;
  extra_data?: Record<string, any>;
}

const API_BASE_URL = environment.apiBaseUrl;

export class OrganizationService {
  static async createOrganization(
    payload: CreateOrganizationPayload,
    token: string
  ): Promise<any> {
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
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating organization');
    }
  }
}
