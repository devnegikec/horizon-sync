import * as React from 'react';
import { useState } from 'react';

import { Save, AlertCircle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { OrganizationSettings as OrganizationSettingsType } from '../../../types/organization-settings.types';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../../types/organization-settings.types';
import { validateOrganizationSettings } from '../../../utils/organization-settings.utils';

import { AddressSettings } from './AddressSettings';
import { CurrencySettings } from './CurrencySettings';
import { NamingSeriesSettings } from './NamingSeriesSettings';

interface OrganizationConfigSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}

export function OrganizationConfigSettings({ organizationId, accessToken, canEdit }: OrganizationConfigSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<OrganizationSettingsType>(DEFAULT_ORGANIZATION_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings from API on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        //   headers: { Authorization: `Bearer ${accessToken}` }
        // });
        // const data = await response.json();
        // setSettings(data.settings || DEFAULT_ORGANIZATION_SETTINGS);
        
        // For now, use default settings
        setSettings(DEFAULT_ORGANIZATION_SETTINGS);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load organization settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organizationId, accessToken, toast]);

  const handleSave = async () => {
    // Validate settings
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
      // TODO: Replace with actual API call
      // await fetch(`/api/organizations/${organizationId}/settings`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${accessToken}`
      //   },
      //   body: JSON.stringify({ settings })
      // });
      
      toast({
        title: 'Success',
        description: 'Organization settings saved successfully',
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCurrenciesChange = (currencies: OrganizationSettingsType['currencies']) => {
    setSettings({ ...settings, currencies });
    setHasChanges(true);
  };

  const handleNamingSeriesChange = (namingSeries: OrganizationSettingsType['naming_series']) => {
    setSettings({ ...settings, naming_series: namingSeries });
    setHasChanges(true);
  };

  const handleAddressChange = (address: OrganizationSettingsType['address']) => {
    setSettings({ ...settings, address });
    setHasChanges(true);
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration Settings</h2>
          <p className="text-muted-foreground">
            Configure currencies, document numbering, and organization details
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {hasChanges && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">You have unsaved changes</p>
          </div>
        </div>
      )}

      {/* Currency Settings */}
      <CurrencySettings
        currencies={settings.currencies}
        onChange={handleCurrenciesChange}
        disabled={saving || !canEdit}
      />

      <Separator />

      {/* Naming Series Settings */}
      <NamingSeriesSettings
        namingSeries={settings.naming_series}
        onChange={handleNamingSeriesChange}
        disabled={saving || !canEdit}
      />

      <Separator />

      {/* Address Settings */}
      <AddressSettings
        address={settings.address}
        onChange={handleAddressChange}
        disabled={saving || !canEdit}
      />

      {/* Save Button (Bottom) */}
      {canEdit && (
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
