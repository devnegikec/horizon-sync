import { environment } from '../../environments/environment';

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
    const response = await fetch(UOMS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch units of measure' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: UomListResponse = await response.json();
    return data.uoms;
  }

  static async create(payload: CreateUomPayload, token: string): Promise<Uom> {
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
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${UOMS_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete unit of measure' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }
  }
}
