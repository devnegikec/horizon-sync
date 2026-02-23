import * as React from 'react';

import { Building2, Calendar, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import type { Organization } from '../types/organization.types';

interface OrganizationDetailsSectionProps {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

export function OrganizationDetailsSection({ organization, loading, error }: OrganizationDetailsSectionProps) {
  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load organization: {error}</p>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          Organization Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="space-y-4">
          {/* Organization Name */}
          <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
              <p className="text-base font-semibold">{organization.name}</p>
            </div>
          </div>

          {/* Display Name */}
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
