import * as React from 'react';

import { Building2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useOrganization } from '../hooks/useOrganization';
import { useUpdateOrganization } from '../hooks/useUpdateOrganization';
import type { UpdateOrganizationRequest } from '../types/organization.types';

import { OrganizationForm } from './OrganizationForm';

interface OrganizationSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}

/**
 * OrganizationSettings Component
 * 
 * Display organization information and provide edit functionality.
 * 
 * Requirements: 7.2, 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7
 */
export function OrganizationSettings({ organizationId, accessToken, canEdit }: OrganizationSettingsProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const { toast } = useToast();

  // Fetch organization data
  // Requirements: 1.1, 1.4, 1.5
  const { organization, loading, error, refetch } = useOrganization(organizationId, accessToken);

  // Update organization hook
  const { updateOrganization, loading: updating } = useUpdateOrganization();

  /**
   * Handle save organization updates
   * Requirements: 2.4, 2.5, 2.6
   */
  const handleSave = async (data: UpdateOrganizationRequest) => {
    try {
      await updateOrganization(organizationId, data, accessToken);
      
      // Requirement 2.5: Display success notification
      toast({
        title: 'Success',
        description: 'Organization details updated successfully',
      });

      // Requirement 2.7: Return to view mode after successful update
      setIsEditing(false);
      
      // Refresh data to show updated values
      await refetch();
    } catch (err) {
      // Requirement 2.6: Display error notification on update failure
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update organization',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle cancel edit mode
   * Requirement 2.7: Discard changes and return to view mode
   */
  const handleCancel = () => {
    setIsEditing(false);
  };

  /**
   * Handle edit button click
   * Requirement 2.3: Toggle to edit mode
   */
  const handleEdit = () => {
    setIsEditing(true);
  };

  /**
   * Render loading skeleton
   * Requirement 1.4: Display loading skeleton during fetch
   */
  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   * Requirement 1.5: Display error message with retry button on fetch failure
   */
  if (error) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Failed to load organization</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render empty state (no organization data)
   */
  if (!organization) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">No organization found</h3>
              <p className="text-sm text-muted-foreground">
                Unable to load organization information
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render edit mode
   * Requirement 2.3: Render OrganizationForm in edit mode
   */
  if (isEditing) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Edit Organization
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update your organization&apos;s basic information
          </p>
        </CardHeader>
        <CardContent>
          <OrganizationForm organization={organization} onSave={handleSave} onCancel={handleCancel} isLoading={updating} />
        </CardContent>
      </Card>
    );
  }

  /**
   * Render view mode
   * Requirements: 1.2, 1.3, 2.1, 2.2
   */
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Organization Information
          </CardTitle>
          {/* Requirement 2.1: Show edit button when canEdit is true */}
          {canEdit && (
            <Button onClick={handleEdit} variant="outline">
              Edit
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your organization details
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Organization Details */}
        <div className="space-y-4">
          {/* Organization Name */}
          {/* Requirement 1.2: Display organization name */}
          <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
              <p className="text-base font-semibold">{organization.name}</p>
            </div>
          </div>

          {/* Display Name */}
          {/* Requirement 1.3: Handle null display_name by showing only name */}
          {organization.display_name && (
            <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                <p className="text-base">{organization.display_name}</p>
              </div>
            </div>
          )}

          {/* Status */}
          {/* Requirement 1.2: Display status */}
          <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  organization.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : organization.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Created At */}
          {/* Requirement 1.2: Display creation date */}
          <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-base">
                {new Date(organization.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
