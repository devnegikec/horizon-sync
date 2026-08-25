import * as React from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { OrganizationProfileSettings } from '../features/organization/components/OrganizationProfileSettings';
import { OrganizationSettings } from '../features/organization/components/OrganizationSettings';
import { FeatureFlagsSettings } from '../features/feature-flags/components/FeatureFlagsSettings';
import { ItemUomConversionsSettings } from '../features/organization/components/ItemUomConversionsSettings';
import { UomSettings } from '../features/organization/components/UomSettings';
import { DEFAULT_ORGANIZATION_SETTINGS } from '../types/organization-settings.types';
import { hasPermissionFromStore } from '../features/organization/utils/permissions';
import { useAuth } from '../hooks';


/**
 * SettingsPage Component
 * 
 * Main container for organization settings page.
 * Displays organization information, currency configuration, and banking settings.
 * 
 * Requirements: 7.1, 6.1, 6.2, 10.1, 10.2, 10.3
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = React.useState('organization');

  // Requirement 6.1, 6.2: Check authentication and redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user || !accessToken) {
    return null;
  }

  // Get organization_id from user
  const organizationId = user.organization_id;

  // If no organization_id, show error message
  if (!organizationId) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your organization settings and preferences
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organization found for your account.</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to edit organization settings from global store
  const canEdit = hasPermissionFromStore('organization.update');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your organization settings and preferences
        </p>
      </div>

      {/* Settings Content with Tabs */}
      {/* Requirement 10.1, 10.2, 10.3: Responsive layout */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (location.pathname !== '/settings') {
          navigate('/settings');
        }
      }} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="items-uom">Items & UOM</TabsTrigger>
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-6">
          {/* Organization details + document address */}
          <OrganizationProfileSettings organizationId={organizationId} accessToken={accessToken} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          {/* Currencies and units of measure */}
          <OrganizationSettings
            organizationId={organizationId}
            accessToken={accessToken}
            canEdit={canEdit}
            initialSettings={DEFAULT_ORGANIZATION_SETTINGS}
            onSettingsChange={() => { }}
          />
        </TabsContent>

        <TabsContent value="items-uom" className="space-y-6">
          {/* Units of measure master + item UOM conversion factors */}
          <UomSettings accessToken={accessToken} disabled={!canEdit} />
          <ItemUomConversionsSettings accessToken={accessToken} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-6">
          {/* Tenant-scoped feature flag overrides */}
          <FeatureFlagsSettings accessToken={accessToken} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

