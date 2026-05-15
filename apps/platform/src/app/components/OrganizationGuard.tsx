import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { CreateOrganizationModal, type OrganizationFormData } from '@horizon-sync/ui/components/organization';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useAuth } from '../hooks';
import { OrganizationService } from '../services/organization.service';

/**
 * Generates a URL-friendly slug from an organization name.
 * e.g. "Acme Inc." → "acme-inc"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface OrganizationGuardProps {
  children: React.ReactNode;
}

/**
 * Shows the Create Organization modal when the logged-in user
 * does not yet belong to an organization (organization_id is null).
 * The modal is non-dismissible — the user must create an org to proceed.
 */
export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { user, accessToken, updateUser } = useAuth();
  const { setOrganization } = useUserStore();
  const { toast } = useToast();

  const needsOrganization = !!user && !user.organization_id;

  const handleCreateOrganization = async (
    data: OrganizationFormData & { logoUrl: string }
  ) => {
    if (!accessToken) return;

    const payload = {
      name: data.organizationName,
      slug: slugify(data.organizationName),
      display_name: data.organizationName,
      description: data.organizationDescription || '',
      website: data.websiteUrl || '',
      organization_type: data.organizationType,
      industry: data.industry,
      status: 'active',
    };

    try {
      const result = await OrganizationService.createOrganization(payload, accessToken);
      const org = result as { id: string; name: string; display_name: string; created_at: string; updated_at: string };

      // Update user store with the new organization_id
      updateUser({ organization_id: org.id });

      // Store the organization details
      setOrganization({
        id: org.id,
        name: org.name,
        display_name: org.display_name || org.name,
        status: 'active',
        is_active: true,
        settings: null,
        extra_data: null,
        created_at: org.created_at,
        updated_at: org.updated_at,
      });

      toast({
        title: 'Organization created',
        description: `${data.organizationName} has been set up successfully.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {children}
      <CreateOrganizationModal
        open={needsOrganization}
        onOpenChange={() => {
          /* non-dismissible — user must create an org */
        }}
        onSubmit={handleCreateOrganization}
        title="Set Up Your Organization"
        description="Create your organization to get started with Horizon Sync."
      />
    </>
  );
}
