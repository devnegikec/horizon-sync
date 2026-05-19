import * as React from 'react';
import { useState } from 'react';

import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { useUserStore } from '@horizon-sync/store';

import { OrganizationService } from '../../../services/organization.service';
import type { OrganizationSettings as OrganizationSettingsType } from '../../../types/organization-settings.types';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../../types/organization-settings.types';
import { validateOrganizationSettings } from '../../../utils/organization-settings.utils';
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
  const { updateOrganization } = useUserStore();
  const [settings, setSettings] = useState<OrganizationSettingsType>(DEFAULT_ORGANIZATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch organization data
  const { organization, loading: orgLoading, error: orgError } = useOrganization(organizationId, accessToken);

  // Fetch settings from API on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const org = await OrganizationService.getOrganization(organizationId, accessToken);
        
        if (org.settings && typeof org.settings === 'object') {
          const orgSettings = org.settings as Record<string, unknown>;
          
          if (
            orgSettings.currencies &&
            Array.isArray(orgSettings.currencies) &&
            orgSettings.naming_series &&
            typeof orgSettings.naming_series === 'object' &&
            orgSettings.address &&
            typeof orgSettings.address === 'object'
          ) {
            setSettings(org.settings as unknown as OrganizationSettingsType);
          } else {
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
        setSettings(DEFAULT_ORGANIZATION_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organizationId, accessToken, toast]);

  const handleAddressChange = (address: OrganizationSettingsType['address']) => {
    setSettings(prev => ({ ...prev, address }));
    setHasChanges(true);
  };

  const handleSettingsChange = (newSettings: OrganizationSettingsType) => {
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const validation = validateOrganizationSettings(settings);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updatedOrganization = await OrganizationService.updateOrganization(
        organizationId,
        { settings: settings as unknown as Record<string, unknown> },
        accessToken
      );

      updateOrganization({ settings: updatedOrganization.settings });
      setHasChanges(false);

      toast({
        title: 'Success',
        description: 'Organization settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save organization settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
      {/* Save bar — shown when there are unsaved changes */}
      {canEdit && hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">You have unsaved changes</p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Organization Details and Address - Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        <OrganizationDetailsSection organization={organization}
          loading={orgLoading}
          error={orgError}/>

        <AddressSettings address={settings.address}
          onChange={handleAddressChange}
          disabled={saving || !canEdit}/>
      </div>

      <Separator />

      {/* Configuration Settings (Currencies and UOMs) */}
      <OrganizationSettings organizationId={organizationId}
        accessToken={accessToken}
        canEdit={canEdit}
        initialSettings={settings}
        onSettingsChange={handleSettingsChange}/>

      {/* Bottom save button */}
      {canEdit && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
