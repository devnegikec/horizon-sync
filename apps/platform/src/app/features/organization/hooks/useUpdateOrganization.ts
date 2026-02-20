import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import type { Organization as StoreOrganization } from '@horizon-sync/store';

import { useAuth } from '../../../hooks/useAuth';
import { OrganizationService, AuthenticationError } from '../../../services/organization.service';
import type { UpdateOrganizationPayload, Organization } from '../../../services/organization.service';

export function useUpdateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateOrganization: updateStoreOrganization } = useUserStore();
  const { restoreSession, accessToken: currentAccessToken } = useAuth();
  const navigate = useNavigate();

  const updateOrganization = async (
    organizationId: string,
    data: UpdateOrganizationPayload,
    accessToken: string
  ): Promise<Organization> => {
    setLoading(true);
    setError(null);

    try {
      const updated = await OrganizationService.updateOrganization(
        organizationId,
        data,
        accessToken
      );

      // Update user store with new organization data
      // Cast to store's Organization type to handle status type difference
      updateStoreOrganization(updated as unknown as StoreOrganization);

      return updated;
    } catch (err) {
      // Handle authentication errors by attempting token refresh
      if (err instanceof AuthenticationError) {
        console.log('Authentication error detected, attempting to restore session...');
        const restored = await restoreSession();
        
        if (!restored) {
          // Token refresh failed, redirect to login
          console.log('Session restoration failed, redirecting to login');
          setError('Your session has expired. Please log in again.');
          navigate('/login');
          throw err;
        }
        
        // Token refreshed successfully, retry the update with new token
        console.log('Session restored, retrying update');
        if (currentAccessToken) {
          const updated = await OrganizationService.updateOrganization(
            organizationId,
            data,
            currentAccessToken
          );
          updateStoreOrganization(updated as unknown as StoreOrganization);
          return updated;
        }
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateOrganization, loading, error };
}
