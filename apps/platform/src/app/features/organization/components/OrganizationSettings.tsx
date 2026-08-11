import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { OrganizationSettings as OrganizationSettingsType } from '../../../types/organization-settings.types';

import { CurrencySettings } from './CurrencySettings';
import { UomSettings } from './UomSettings';

interface OrganizationSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
  initialSettings: OrganizationSettingsType;
  onSettingsChange: (settings: OrganizationSettingsType) => void;
}

export function OrganizationSettings({
  accessToken,
  canEdit,
}: OrganizationSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration Settings</h2>
        <p className="text-muted-foreground">Configure currencies and units of measure</p>
      </div>

      {/* Currency Settings */}
      <CurrencySettings accessToken={accessToken} disabled={!canEdit} />

      <Separator />

      {/* Unit of Measure Settings */}
      <UomSettings accessToken={accessToken} disabled={!canEdit} />
    </div>
  );
}
