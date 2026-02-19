import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';

import { useAuth } from '../../../hooks/useAuth';
import { OrganizationService, AuthenticationError } from '../../../services/organization.service';
import type { Organization } from '../types/organization.types';

export function useOrganization(
  organizationId: string | null,
  accessToken: string | null
) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setOrganization: setStoreOrganization } = useUserStore();
  const { restoreSession } = useAuth();
  const navigate = useNavigate();

  const fetchOrganization = useCallback(async () => {
    if (!organizationId || !accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await OrganizationService.getOrganization(organizationId, accessToken);
      // Cast the API response to the Organization type expected by the store
      const orgData = data as unknown as Organization;
      setOrganization(orgData);
      setStoreOrganization(orgData);
    } catch (err) {
      // Handle authentication errors by attempting token refresh
      if (err instanceof AuthenticationError) {
        console.log('Authentication error detected, attempting to restore session...');
        const restored = await restoreSession();
        
        if (!restored) {
          // Token refresh failed, redirect to login
          console.log('Session restoration failed, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Token refreshed successfully, retry the fetch
        console.log('Session restored, retrying fetch');
        // The useEffect will trigger again with the new accessToken
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
    } finally {
      setLoading(false);
    }
  }, [organizationId, accessToken, setStoreOrganization, restoreSession, navigate]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return { organization, loading, error, refetch: fetchOrganization };
}
