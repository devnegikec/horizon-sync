import * as React from 'react';

import { Organization, OrganizationService } from '../services/organization.service';

interface OrganizationState {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

// Simple in-memory cache for organization data
const organizationCache = new Map<string, Organization>();

export function useOrganization(organizationId: string | null | undefined, accessToken: string | null) {
  const [state, setState] = React.useState<OrganizationState>({
    organization: null,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    if (!organizationId || !accessToken) {
      setState({ organization: null, loading: false, error: null });
      return;
    }

    // Check cache first
    const cached = organizationCache.get(organizationId);
    if (cached) {
      setState({ organization: cached, loading: false, error: null });
      return;
    }

    const fetchOrganization = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await OrganizationService.getOrganization(organizationId, accessToken);

        // Store in cache
        organizationCache.set(organizationId, data);

        setState({ organization: data, loading: false, error: null });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
        setState({ organization: null, loading: false, error: errorMessage });
      }
    };

    fetchOrganization();
  }, [organizationId, accessToken]);

  return state;
}

// Export function to clear cache if needed
export function clearOrganizationCache(organizationId?: string) {
  if (organizationId) {
    organizationCache.delete(organizationId);
  } else {
    organizationCache.clear();
  }
}
