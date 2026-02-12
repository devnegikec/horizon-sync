import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl;

export interface UserPermissionsResponse {
  user_id: string;
  organization_id: string;
  permissions: string[];
  roles: string[];
  has_access: boolean;
}

/**
 * Utility function to handle API errors consistently
 */
async function handleApiError(response: Response): Promise<never> {
  let message = `HTTP error! status: ${response.status}`;
  
  try {
    const errorData = await response.json();
    
    // Handle different error response formats
    if (errorData?.detail?.message) {
      message = errorData.detail.message;
    } else if (typeof errorData === 'string') {
      message = errorData;
    } else if (errorData && typeof errorData === 'object') {
      // Handle validation errors or other structured errors
      message = JSON.stringify(errorData);
    }
  } catch {
    // If JSON parsing fails, use status-based messages
    switch (response.status) {
      case 401:
        message = 'Authentication failed. Please login again.';
        break;
      case 403:
        message = 'Access denied. You do not have permission to view permissions.';
        break;
      case 404:
        message = 'Permissions not found.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = `HTTP error! status: ${response.status}`;
    }
  }
  
  throw new Error(message);
}

export class PermissionsService {
  /**
   * Fetch user permissions for a specific organization
   */
  static async getUserPermissions(
    organizationId: string, 
    accessToken: string
  ): Promise<UserPermissionsResponse> {
    const url = `${API_BASE_URL}/identity/users/me/permissions?organization_id=${organizationId}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Permissions API request error:', error);
      if (error instanceof Error) throw error;
      throw new Error('An unexpected error occurred while fetching permissions');
    }
  }
}