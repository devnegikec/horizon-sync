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

const UOMS_URL = `${environment.apiCoreUrl}/api/v1/uoms`;

export interface Uom {
  id: string;
  organization_id: string;
  name: string;
  abbreviation: string;
  description: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUomPayload {
  name: string;
  abbreviation: string;
  description: string;
}

interface UomListResponse {
  uoms: Uom[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export class UomService {
  static async list(token: string): Promise<Uom[]> {
    try {
      const response = await fetch(UOMS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch units of measure' }));
        throw new Error(errorData.detail || errorData.message || getFriendlyMessage(response.status));
      }

      const data: UomListResponse = await response.json();
      return data.uoms;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      if (error instanceof Error) throw error;
      throw new Error('Something went wrong. Please try again later.');
    }
  }

  static async create(payload: CreateUomPayload, token: string): Promise<Uom> {
    try {
      const response = await fetch(UOMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create unit of measure' }));
        throw new Error(errorData.detail || errorData.message || getFriendlyMessage(response.status));
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      if (error instanceof Error) throw error;
      throw new Error('Something went wrong. Please try again later.');
    }
  }

  static async delete(id: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${UOMS_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete unit of measure' }));
        throw new Error(errorData.detail || errorData.message || getFriendlyMessage(response.status));
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      if (error instanceof Error) throw error;
      throw new Error('Something went wrong. Please try again later.');
    }
  }
}
