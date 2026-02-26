import * as React from 'react';
import { useState } from 'react';

import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { OrganizationService } from '../../../services/organization.service';
import type { OrganizationSettings as OrganizationSettingsType } from '../../../types/organization-settings.types';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../../types/organization-settings.types';
import { useOrganization } from '../hooks/useOrganization';

import { AddressSettings } from './AddressSettings';
import { OrganizationDetailsSection } from './OrganizationDetailsSection';
import { OrganizationSettings } from './OrganizationSettings';

interface OrganizationConfigSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}

export function OrganizationConfigSettings({ organizationId, accessToken, canEdit }: OrganizationConfigSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<OrganizationSettingsType>(DEFAULT_ORGANIZATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Fetch organization data
  const { organization, loading: orgLoading, error: orgError } = useOrganization(organizationId, accessToken);

  // Fetch settings from API on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const organization = await OrganizationService.getOrganization(organizationId, accessToken);
        
        // If organization has settings, validate and use them; otherwise use defaults
        if (organization.settings && typeof organization.settings === 'object') {
          // Check if settings has the required structure
          const orgSettings = organization.settings as Record<string, unknown>;
          
          if (
            orgSettings.currencies &&
            Array.isArray(orgSettings.currencies) &&
            orgSettings.naming_series &&
            typeof orgSettings.naming_series === 'object' &&
            orgSettings.address &&
            typeof orgSettings.address === 'object'
          ) {
            setSettings(organization.settings as unknown as OrganizationSettingsType);
          } else {
            // Settings exist but don't have the correct structure, use defaults
            console.warn('Organization settings exist but have invalid structure, using defaults');
            setSettings(DEFAULT_ORGANIZATION_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_ORGANIZATION_SETTINGS);
        }
      } catch (error) {
        console.error('Failed to load organization settings:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load organization settings',
          variant: 'destructive',
        });
        // Use default settings on error
        setSettings(DEFAULT_ORGANIZATION_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organizationId, accessToken, toast]);

  const handleAddressChange = (address: OrganizationSettingsType['address']) => {
    setSettings({ ...settings, address });
  };

  const handleSettingsChange = (newSettings: OrganizationSettingsType) => {
    setSettings(newSettings);
  };

  if (loading || orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load organization: {orgError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Details and Address - Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Information Card */}
        <OrganizationDetailsSection organization={organization}
          loading={orgLoading}
          error={orgError}/>

        {/* Address Settings Card */}
        <AddressSettings address={settings.address}
          onChange={handleAddressChange}
          disabled={!canEdit}/>
      </div>

      <Separator />

      {/* Configuration Settings (Currencies and Naming Series) */}
      <OrganizationSettings organizationId={organizationId}
        accessToken={accessToken}
        canEdit={canEdit}
        initialSettings={settings}
        onSettingsChange={handleSettingsChange}/>
    </div>
  );
}
