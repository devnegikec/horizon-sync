import * as React from 'react';

import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';

// import { CurrencySettings } from '../features/organization/components/CurrencySettings';
import { OrganizationConfigSettings } from '../features/organization/components/OrganizationConfigSettings';
import { OrganizationSettings } from '../features/organization/components/OrganizationSettings';
import { hasPermissionFromStore } from '../features/organization/utils/permissions';
import { useAuth } from '../hooks';


/**
 * SettingsPage Component
 * 
 * Main container for organization settings page.
 * Displays organization information and currency configuration.
 * 
 * Requirements: 7.1, 6.1, 6.2, 10.1, 10.2, 10.3
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();
  const { organization } = useUserStore();

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

      {/* Settings Content */}
      {/* Requirement 10.1, 10.2, 10.3: Responsive layout */}
      <div className="space-y-6">
        {/* Organization Basic Information */}
        <OrganizationSettings organizationId={organizationId} accessToken={accessToken} canEdit={canEdit} />

        {/* Organization Configuration Settings (Currencies, Naming Series, Address) */}
        <OrganizationConfigSettings organizationId={organizationId} accessToken={accessToken} canEdit={canEdit} />
      </div>
    </div>
  );
}
