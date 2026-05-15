import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl;

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
  let message = getFriendlyMessage(response.status);
  
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
        message = getFriendlyMessage(response.status);
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
    const url = `${API_BASE_URL}/api/v1/identity/users/me/permissions?organization_id=${organizationId}`;
    
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
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      console.error('Permissions API request error:', error);
      if (error instanceof Error) throw error;
      throw new Error('An unexpected error occurred while fetching permissions');
    }
  }
}