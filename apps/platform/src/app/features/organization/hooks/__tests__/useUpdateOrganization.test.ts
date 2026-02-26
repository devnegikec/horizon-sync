import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateOrganization } from '../useUpdateOrganization';
import { OrganizationService } from '../../../../services/organization.service';
import { useUserStore } from '@horizon-sync/store';

// Mock dependencies
jest.mock('../../../../services/organization.service');
jest.mock('@horizon-sync/store');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
const mockRestoreSession = jest.fn();
const mockAccessToken = 'test-token';
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    restoreSession: mockRestoreSession,
    accessToken: mockAccessToken,
  }),
}), { virtual: true });

describe('useUpdateOrganization', () => {
  const mockOrgId = 'org-123';
  const mockToken = 'test-token';
  const mockOrganization = {
    id: mockOrgId,
    name: 'Updated Org',
    slug: 'test-org',
    display_name: 'Updated Organization',
    organization_type: 'business',
    industry: 'technology',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockUpdateOrganization = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockRestoreSession.mockClear();
    
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      updateOrganization: mockUpdateOrganization,
    });
  });

  it('should update organization successfully', async () => {
    (OrganizationService.updateOrganization as jest.Mock).mockResolvedValueOnce(
      mockOrganization
    );

    const { result } = renderHook(() => useUpdateOrganization());

    expect(result.current.loading).toBe(false);

    const updatedOrg = await result.current.updateOrganization(
      mockOrgId,
      { name: 'Updated Org', display_name: 'Updated Organization' },
      mockToken
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(updatedOrg).toEqual(mockOrganization);
    expect(result.current.error).toBeNull();
    expect(mockUpdateOrganization).toHaveBeenCalledWith(mockOrganization);
  });

  it('should handle loading state during update', async () => {
    (OrganizationService.updateOrganization as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockOrganization), 100))
    );

    const { result } = renderHook(() => useUpdateOrganization());

    const updatePromise = result.current.updateOrganization(
      mockOrgId,
      { name: 'Updated Org' },
      mockToken
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await updatePromise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle error state on update failure', async () => {
    const errorMessage = 'Failed to update organization';
    (OrganizationService.updateOrganization as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useUpdateOrganization());

    await expect(
      result.current.updateOrganization(mockOrgId, { name: 'Updated Org' }, mockToken)
    ).rejects.toThrow(errorMessage);

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    expect(mockUpdateOrganization).not.toHaveBeenCalled();
  });

  it('should update user store on successful update', async () => {
    (OrganizationService.updateOrganization as jest.Mock).mockResolvedValueOnce(
      mockOrganization
    );

    const { result } = renderHook(() => useUpdateOrganization());

    await result.current.updateOrganization(
      mockOrgId,
      { name: 'Updated Org' },
      mockToken
    );

    await waitFor(() => {
      expect(mockUpdateOrganization).toHaveBeenCalledWith(mockOrganization);
    });
  });

  it('should clear error on new update attempt', async () => {
    // First update fails
    (OrganizationService.updateOrganization as jest.Mock).mockRejectedValueOnce(
      new Error('First error')
    );

    const { result } = renderHook(() => useUpdateOrganization());

    await expect(
      result.current.updateOrganization(mockOrgId, { name: 'Test' }, mockToken)
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Second update succeeds
    (OrganizationService.updateOrganization as jest.Mock).mockResolvedValueOnce(
      mockOrganization
    );

    await result.current.updateOrganization(
      mockOrgId,
      { name: 'Updated Org' },
      mockToken
    );

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
