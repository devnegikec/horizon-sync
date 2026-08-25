import * as React from 'react';
import { useState } from 'react';

import { AlertCircle, Save } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { useUserStore } from '@horizon-sync/store';

import { OrganizationService } from '../../../services/organization.service';
import type {
    AddressConfig,
    OrganizationSettings as OrganizationSettingsType,
} from '../../../types/organization-settings.types';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../../../types/organization-settings.types';
import { useOrganization } from '../hooks/useOrganization';

import { AddressSettings } from './AddressSettings';
import { OrganizationDetailsSection } from './OrganizationDetailsSection';

interface OrganizationProfileSettingsProps {
    organizationId: string;
    accessToken: string;
    canEdit: boolean;
}

/**
 * Organization profile settings: organization details + document address.
 * Keeps its own address state and save flow so it can live in its own tab.
 */
export function OrganizationProfileSettings({
    organizationId,
    accessToken,
    canEdit,
}: OrganizationProfileSettingsProps) {
    const { toast } = useToast();
    const { updateOrganization } = useUserStore();
    const [address, setAddress] = useState<AddressConfig>(
        DEFAULT_ORGANIZATION_SETTINGS.address,
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const { organization, loading: orgLoading, error: orgError } = useOrganization(
        organizationId,
        accessToken,
    );

    React.useEffect(() => {
        let cancelled = false;
        const fetchSettings = async () => {
            try {
                const org = await OrganizationService.getOrganization(organizationId, accessToken);
                if (!cancelled) {
                    if (org.settings && typeof org.settings.address === 'object') {
                        setAddress(org.settings.address as AddressConfig);
                    }
                }
            } catch (error) {
                console.error('Failed to load organization settings:', error);
                if (!cancelled) {
                    toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to load settings',
                        variant: 'destructive',
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchSettings();
        return () => {
            cancelled = true;
        };
    }, [organizationId, accessToken, toast]);

    const handleAddressChange = (next: AddressConfig) => {
        setAddress(next);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Preserve other settings (currencies, naming_series, …) while updating address.
            const org = await OrganizationService.getOrganization(organizationId, accessToken);
            const currentSettings = (org.settings as OrganizationSettingsType | undefined) ?? DEFAULT_ORGANIZATION_SETTINGS;
            const updatedSettings: OrganizationSettingsType = {
                ...currentSettings,
                address,
            };

            const updatedOrganization = await OrganizationService.updateOrganization(
                organizationId,
                { settings: updatedSettings as unknown as Record<string, unknown> },
                accessToken,
            );

            updateOrganization({ settings: updatedOrganization.settings });
            setHasChanges(false);
            toast({
                title: 'Success',
                description: 'Organization address saved successfully',
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

    return (
        <div className="space-y-6">
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

            {orgError ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">Failed to load organization: {orgError}</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    <OrganizationDetailsSection
                        organization={organization}
                        loading={orgLoading}
                        error={orgError}
                    />
                    <AddressSettings
                        address={address}
                        onChange={handleAddressChange}
                        disabled={saving || !canEdit}
                    />
                </div>
            )}

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
