import { useUserStore } from '../user-store';

describe('User Store - Organization Actions', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('setOrganization', () => {
    it('should set organization in store', () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        display_name: 'Test Organization',
        organization_type: 'business',
        industry: 'technology',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { setOrganization } = useUserStore.getState();
      setOrganization(mockOrganization);

      const state = useUserStore.getState();
      expect(state.organization).toEqual(mockOrganization);
    });

    it('should replace existing organization', () => {
      const firstOrg = {
        id: 'org-1',
        name: 'First Org',
        slug: 'first-org',
        display_name: 'First Organization',
        organization_type: 'business',
        industry: 'technology',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const secondOrg = {
        id: 'org-2',
        name: 'Second Org',
        slug: 'second-org',
        display_name: 'Second Organization',
        organization_type: 'business',
        industry: 'finance',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const { setOrganization } = useUserStore.getState();
      setOrganization(firstOrg);
      setOrganization(secondOrg);

      const state = useUserStore.getState();
      expect(state.organization).toEqual(secondOrg);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization with partial data', () => {
      const initialOrg = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        display_name: 'Test Organization',
        organization_type: 'business',
        industry: 'technology',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { setOrganization, updateOrganization } = useUserStore.getState();
      setOrganization(initialOrg);

      updateOrganization({
        name: 'Updated Org',
        display_name: 'Updated Organization',
      });

      const state = useUserStore.getState();
      expect(state.organization).toEqual({
        ...initialOrg,
        name: 'Updated Org',
        display_name: 'Updated Organization',
      });
    });

    it('should update organization settings', () => {
      const initialOrg = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        display_name: 'Test Organization',
        organization_type: 'business',
        industry: 'technology',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { setOrganization, updateOrganization } = useUserStore.getState();
      setOrganization(initialOrg);

      updateOrganization({
        settings: { currency: 'USD' },
      });

      const state = useUserStore.getState();
      expect(state.organization?.settings).toEqual({ currency: 'USD' });
    });

    it('should do nothing when organization is null', () => {
      const { updateOrganization } = useUserStore.getState();

      updateOrganization({
        name: 'Updated Org',
      });

      const state = useUserStore.getState();
      expect(state.organization).toBeNull();
    });
  });

  describe('organization retrieval', () => {
    it('should retrieve organization from store', () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        display_name: 'Test Organization',
        organization_type: 'business',
        industry: 'technology',
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const { setOrganization } = useUserStore.getState();
      setOrganization(mockOrganization);

      const state = useUserStore.getState();
      expect(state.organization).toEqual(mockOrganization);
    });

    it('should return null when no organization is set', () => {
      const state = useUserStore.getState();
      expect(state.organization).toBeNull();
    });
  });
});
