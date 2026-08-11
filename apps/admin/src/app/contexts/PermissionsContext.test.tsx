import { render, screen, waitFor, act } from '@testing-library/react';

import { useUserStore } from '@horizon-sync/store';

import { PermissionsProvider, usePermissionsContext } from './PermissionsContext';

// Mock the environment
jest.mock('../../environments/environment', () => ({
  environment: {
    apiCoreUrl: 'http://localhost:8001',
  },
}));

// Mock the error handler
jest.mock('../utils/error-handler', () => ({
  handleApiError: jest.fn(),
}));

// Helper component that renders context values
function TestConsumer() {
  const ctx = usePermissionsContext();
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="error">{ctx.error ?? 'none'}</span>
      <span data-testid="permissions">{JSON.stringify(ctx.permissions)}</span>
      <span data-testid="has-users-read">
        {String(ctx.hasPermission('system_admin.users_read'))}
      </span>
      <span data-testid="has-any">
        {String(
          ctx.hasAnyPermission([
            'system_admin.billing_read',
            'system_admin.users_read',
          ])
        )}
      </span>
    </div>
  );
}

describe('PermissionsContext', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the user store
    useUserStore.setState({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
      organization: null,
      permissions: { permissions: [], roles: [], hasAccess: false, lastFetched: null },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should show loading=false and empty permissions when no token', async () => {
    render(
      <PermissionsProvider>
        <TestConsumer />
      </PermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('permissions').textContent).toBe('[]');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('should fetch permissions when token is present', async () => {
    const mockPermissions = ['system_admin.users_read', 'system_admin.billing_read'];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          user_id: 'user-1',
          user_type: 'system_admin',
          permissions: mockPermissions,
        }),
    });

    useUserStore.setState({ accessToken: 'test-token' });

    render(
      <PermissionsProvider>
        <TestConsumer />
      </PermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('permissions').textContent).toBe(
      JSON.stringify(mockPermissions)
    );
    expect(screen.getByTestId('error').textContent).toBe('none');
    expect(screen.getByTestId('has-users-read').textContent).toBe('true');
    expect(screen.getByTestId('has-any').textContent).toBe('true');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/v1/admin/me/permissions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should set error when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ detail: 'Forbidden' }),
    });

    useUserStore.setState({ accessToken: 'bad-token' });

    render(
      <PermissionsProvider>
        <TestConsumer />
      </PermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('error').textContent).toContain('HTTP error');
    expect(screen.getByTestId('permissions').textContent).toBe('[]');
  });

  it('should expose hasPermission with master check', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          user_id: 'user-1',
          user_type: 'system_admin',
          permissions: ['system_admin.master'],
        }),
    });

    useUserStore.setState({ accessToken: 'master-token' });

    render(
      <PermissionsProvider>
        <TestConsumer />
      </PermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Master permission grants access to everything
    expect(screen.getByTestId('has-users-read').textContent).toBe('true');
    expect(screen.getByTestId('has-any').textContent).toBe('true');
  });

  it('should return false for hasPermission when permission is not held', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          user_id: 'user-1',
          user_type: 'system_admin',
          permissions: ['system_admin.billing_read'],
        }),
    });

    useUserStore.setState({ accessToken: 'limited-token' });

    render(
      <PermissionsProvider>
        <TestConsumer />
      </PermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Does not have users_read
    expect(screen.getByTestId('has-users-read').textContent).toBe('false');
    // Has billing_read so hasAnyPermission should be true
    expect(screen.getByTestId('has-any').textContent).toBe('true');
  });
});
