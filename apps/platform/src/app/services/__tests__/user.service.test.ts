import { UserService } from '../user.service';
import type { User, UsersResponse, InviteUserPayload, InviteUserResponse } from '../user.service';

global.fetch = jest.fn();

const mockToken = 'test-token';

const mockUser: User = {
  id: 'user-1',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  display_name: 'John Doe',
  phone: null,
  avatar_url: null,
  user_type: 'regular',
  status: 'active',
  is_active: true,
  email_verified: true,
  mfa_enabled: false,
  timezone: null,
  language: null,
  last_login_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateMe', () => {
    it('should update user profile successfully', async () => {
      const updated = { ...mockUser, first_name: 'Jane' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      });

      const result = await UserService.updateMe({ first_name: 'Jane' }, mockToken);

      expect(result).toEqual(updated);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/identity/users/me'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify({ first_name: 'Jane' }),
        }),
      );
    });

    it('should throw on HTTP error with server message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid phone format' }),
      });

      await expect(UserService.updateMe({ phone: 'bad' }, mockToken))
        .rejects.toThrow('Invalid phone format');
    });

    it('should throw fallback message when JSON parse fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json'); },
      });

      await expect(UserService.updateMe({}, mockToken))
        .rejects.toThrow('Failed to update user profile');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(UserService.updateMe({}, mockToken))
        .rejects.toThrow('Network error');
    });
  });

  describe('getUsers', () => {
    const mockResponse: UsersResponse = {
      items: [mockUser],
      total: 1,
      page: 1,
      page_size: 20,
      pages: 1,
      has_next: false,
      has_prev: false,
    };

    it('should fetch users with default pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await UserService.getUsers(1, 20, mockToken);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&page_size=20'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        }),
      );
    });

    it('should pass custom page and pageSize', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await UserService.getUsers(3, 50, mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=3&page_size=50'),
        expect.anything(),
      );
    });

    it('should throw on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Permission denied' }),
      });

      await expect(UserService.getUsers(1, 20, mockToken))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('inviteUser', () => {
    const payload: InviteUserPayload = {
      email: 'new@example.com',
      first_name: 'New',
      last_name: 'User',
    };

    const mockInviteResponse: InviteUserResponse = {
      invitation_id: 'inv-1',
      email: 'new@example.com',
      expires_at: '2024-02-01T00:00:00Z',
      invitation_url: 'https://app.example.com/invite/abc',
    };

    it('should invite user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInviteResponse,
      });

      const result = await UserService.inviteUser(payload, mockToken);

      expect(result).toEqual(mockInviteResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/identity/invitations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
    });

    it('should throw on HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'User already exists' }),
      });

      await expect(UserService.inviteUser(payload, mockToken))
        .rejects.toThrow('User already exists');
    });

    it('should throw fallback message when JSON parse fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json'); },
      });

      await expect(UserService.inviteUser(payload, mockToken))
        .rejects.toThrow('Failed to invite user');
    });
  });
});
