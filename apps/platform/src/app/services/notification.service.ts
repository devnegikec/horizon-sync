import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiCoreUrl;

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

async function handleApiError(response: Response): Promise<never> {
  let message = getFriendlyMessage(response.status);
  try {
    const errorData = await response.json();
    if (errorData?.detail?.message) {
      message = errorData.detail.message;
    } else if (typeof errorData === 'string') {
      message = errorData;
    } else if (errorData && typeof errorData === 'object') {
      message = JSON.stringify(errorData);
    }
  } catch {
    message = getFriendlyMessage(response.status);
  }
  throw new Error(message);
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_no: string | null;
  warehouse_id: string | null;
  sender_id: string | null;
  sender_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
}

export class NotificationService {
  static async getNotifications(
    accessToken: string,
    page: number = 1,
    pageSize: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    const url = new URL(`${API_BASE_URL}/api/v1/notifications`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    if (unreadOnly) {
      url.searchParams.set('unread_only', 'true');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  }

  static async getCount(accessToken: string): Promise<NotificationCountResponse> {
    const url = `${API_BASE_URL}/api/v1/notifications/count`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  }

  static async markAsRead(notificationId: string, accessToken: string): Promise<NotificationItem> {
    const url = `${API_BASE_URL}/api/v1/notifications/${notificationId}/read`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  }

  static async markAllAsRead(accessToken: string): Promise<void> {
    const url = `${API_BASE_URL}/api/v1/notifications/mark-all-read`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  }
}
