import { AuthService } from '../../../app/services/auth.service';

describe('AuthService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginPayload = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw an error with "Invalid email or password" when server responds with 401', async () => {
      const mockErrorResponse = {
        detail: {
          message: 'Invalid email or password',
          status_code: 401,
          code: 'INVALID_CREDENTIALS',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue(mockErrorResponse),
      });

      await expect(AuthService.login(loginPayload)).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error with "Account locked" when server responds with 423', async () => {
      const mockErrorResponse = {
        detail: {
          message: 'Account has been locked due to multiple failed login attempts. Please try again later or contact support.',
          status_code: 423,
          code: 'ACCOUNT_LOCKED',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 423,
        json: jest.fn().mockResolvedValue(mockErrorResponse),
      });

      await expect(AuthService.login(loginPayload)).rejects.toThrow(
        'Account has been locked due to multiple failed login attempts. Please try again later or contact support.'
      );
    });

    it('should return LoginResponse on successful login', async () => {
      const mockSuccessResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockSuccessResponse),
      });

      const result = await AuthService.login(loginPayload);
      expect(result).toEqual(mockSuccessResponse);
    });
  });
});
