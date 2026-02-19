import { OrganizationService, AuthenticationError } from '../organization.service';
import type { Organization, UpdateOrganizationPayload } from '../organization.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('OrganizationService', () => {
  const mockToken = 'test-token';
  const mockOrgId = 'org-123';
  const mockOrganization: Organization = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganization', () => {
    it('should fetch organization successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrganization,
      });

      const result = await OrganizationService.getOrganization(mockOrgId, mockToken);

      expect(result).toEqual(mockOrganization);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/identity/organizations/${mockOrgId}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should include Authorization header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrganization,
      });

      await OrganizationService.getOrganization(mockOrgId, mockToken);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Organization not found' }),
      });

      await expect(
        OrganizationService.getOrganization(mockOrgId, mockToken)
      ).rejects.toThrow('Organization not found');
    });

    it('should handle network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        OrganizationService.getOrganization(mockOrgId, mockToken)
      ).rejects.toThrow('Network error');
    });

    it('should throw AuthenticationError on 401 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        OrganizationService.getOrganization(mockOrgId, mockToken)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw correct error message on 401 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        OrganizationService.getOrganization(mockOrgId, mockToken)
      ).rejects.toThrow('Authentication failed. Please log in again.');
    });
  });

  describe('updateOrganization', () => {
    const updatePayload: UpdateOrganizationPayload = {
      name: 'Updated Org',
      display_name: 'Updated Organization',
    };

    it('should update organization successfully', async () => {
      const updatedOrg = { ...mockOrganization, ...updatePayload };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedOrg,
      });

      const result = await OrganizationService.updateOrganization(
        mockOrgId,
        updatePayload,
        mockToken
      );

      expect(result).toEqual(updatedOrg);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/identity/organizations/${mockOrgId}`),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(updatePayload),
        })
      );
    });

    it('should include Authorization header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrganization,
      });

      await OrganizationService.updateOrganization(mockOrgId, updatePayload, mockToken);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Permission denied' }),
      });

      await expect(
        OrganizationService.updateOrganization(mockOrgId, updatePayload, mockToken)
      ).rejects.toThrow('Permission denied');
    });

    it('should throw AuthenticationError on 401 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        OrganizationService.updateOrganization(mockOrgId, updatePayload, mockToken)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw correct error message on 401 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(
        OrganizationService.updateOrganization(mockOrgId, updatePayload, mockToken)
      ).rejects.toThrow('Authentication failed. Please log in again.');
    });
  });
});
