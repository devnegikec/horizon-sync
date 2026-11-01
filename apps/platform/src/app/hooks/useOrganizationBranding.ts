import * as React from 'react';

import { useUserStore, type Organization as StoreOrganization } from '@horizon-sync/store';

import { OrganizationService } from '../services/organization.service';

/**
 * Reads the organization logo from `settings.logo_url` (editable in Settings),
 * falling back to `extra_data.logo_url` (the value written during onboarding).
 */
export function getOrganizationLogoUrl(organization: {
  settings?: Record<string, unknown> | null;
  extra_data?: Record<string, unknown> | null;
} | null): string {
  const fromSettings = organization?.settings?.logo_url;
  if (typeof fromSettings === 'string' && fromSettings.trim()) return fromSettings.trim();

  const fromExtraData = organization?.extra_data?.logo_url;
  if (typeof fromExtraData === 'string' && fromExtraData.trim()) return fromExtraData.trim();

  return '';
}

/**
 * Resolves the current organization's display name and logo.
 *
 * Values come from the persisted user store. If the store has not loaded the
 * organization yet (e.g. immediately after login), it is fetched once and
 * written back to the store so every consumer shares the same data.
 */
export function useOrganizationBranding() {
  const user = useUserStore((s) => s.user);
  const accessToken = useUserStore((s) => s.accessToken);
  const organization = useUserStore((s) => s.organization);
  const setOrganization = useUserStore((s) => s.setOrganization);

  const organizationId = user?.organization_id ?? null;
  const loadedOrganizationId = organization?.id ?? null;

  React.useEffect(() => {
    if (!organizationId || !accessToken) return;
    if (loadedOrganizationId === organizationId) return;

    let cancelled = false;

    OrganizationService.getOrganization(organizationId, accessToken)
      .then((org) => {
        if (cancelled) return;
        const storeOrganization: StoreOrganization = {
          id: org.id,
          name: org.name,
          display_name: org.display_name ?? null,
          status: org.status as StoreOrganization['status'],
          is_active: org.status === 'active',
          settings: org.settings ?? null,
          extra_data: org.extra_data ?? null,
          created_at: org.created_at,
          updated_at: org.updated_at,
        };
        setOrganization(storeOrganization);
      })
      .catch((error) => {
        console.warn('[useOrganizationBranding] Failed to load organization:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, accessToken, loadedOrganizationId, setOrganization]);

  return {
    organizationId,
    name: organization?.display_name || organization?.name || '',
    logoUrl: getOrganizationLogoUrl(organization),
  };
}
