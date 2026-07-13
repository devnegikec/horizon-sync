import { renderHook, waitFor } from '@testing-library/react';
import { useOrganization } from '../useOrganization';
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
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    restoreSession: mockRestoreSession,
  }),
}), { virtual: true });

describe('useOrganization', () => {
  const mockOrgId = 'org-123';
  const mockToken = 'test-token';
  const mockOrganization = {
    id: mockOrgId,
    name: 'Test Org',
    slug: 'test-org',
    display_name: 'Test Organization',
    organization_type: 'business',
    industry: 'technology',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSetOrganization = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockRestoreSession.mockClear();
    
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      setOrganization: mockSetOrganization,
    });
  });

  it('should fetch organization data successfully', async () => {
    (OrganizationService.getOrganization as jest.Mock).mockResolvedValueOnce(
      mockOrganization
    );

    const { result } = renderHook(() => useOrganization(mockOrgId, mockToken));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organization).toEqual(mockOrganization);
    expect(result.current.error).toBeNull();
    expect(mockSetOrganization).toHaveBeenCalledWith(mockOrganization);
  });

  it('should handle loading state', async () => {
    (OrganizationService.getOrganization as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockOrganization), 100))
    );

    const { result } = renderHook(() => useOrganization(mockOrgId, mockToken));

    expect(result.current.loading).toBe(true);
    expect(result.current.organization).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle error state', async () => {
    const errorMessage = 'Failed to fetch organization';
    (OrganizationService.getOrganization as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useOrganization(mockOrgId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.organization).toBeNull();
    expect(mockSetOrganization).not.toHaveBeenCalled();
  });

  it('should not fetch when organizationId is null', async () => {
    const { result } = renderHook(() => useOrganization(null, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(OrganizationService.getOrganization).not.toHaveBeenCalled();
    expect(result.current.organization).toBeNull();
  });

  it('should not fetch when accessToken is null', async () => {
    const { result } = renderHook(() => useOrganization(mockOrgId, null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(OrganizationService.getOrganization).not.toHaveBeenCalled();
    expect(result.current.organization).toBeNull();
  });

  it('should provide refetch function', async () => {
    (OrganizationService.getOrganization as jest.Mock).mockResolvedValue(
      mockOrganization
    );

    const { result } = renderHook(() => useOrganization(mockOrgId, mockToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refetch
    await result.current.refetch();

    expect(OrganizationService.getOrganization).toHaveBeenCalledTimes(1);
  });

  it('should update user store on successful fetch', async () => {
    (OrganizationService.getOrganization as jest.Mock).mockResolvedValueOnce(
      mockOrganization
    );

    renderHook(() => useOrganization(mockOrgId, mockToken));

    await waitFor(() => {
      expect(mockSetOrganization).toHaveBeenCalledWith(mockOrganization);
    });
  });
});
