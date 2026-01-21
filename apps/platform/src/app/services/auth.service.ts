export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  organization_id: string;
  message: string;
}

export interface ApiError {
  message: string;
  details?: unknown;
}

const API_BASE_URL = 'http://192.168.68.102:8001/api/v1';

export class AuthService {
  static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Registration failed',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: RegisterResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during registration');
    }
  }
}
