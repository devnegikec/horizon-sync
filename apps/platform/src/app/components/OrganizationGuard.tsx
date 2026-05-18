import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { useCurrencyStore, useUserStore } from '@horizon-sync/store';
import { CreateOrganizationModal, type OrganizationFormData } from '@horizon-sync/ui/components/organization';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { environment } from '../../environments/environment';
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

/**
 * Poll the currency API until the base currency is confirmed seeded.
 * Returns the confirmed base_currency code, or null if timed out.
 */
async function waitForCurrencySeeded(
  accessToken: string,
  expectedCurrency: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/currency/currencies`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.currencies?.length > 0 && data.base_currency) {
          if (data.base_currency === expectedCurrency || data.currencies.length >= 3) {
            return data.base_currency;
          }
        }
      }
    } catch {
      // Network error — keep trying
    }
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return null;
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
  const [settingUp, setSettingUp] = React.useState(false);

  const needsOrganization = !!user && !user.organization_id;

  const handleCreateOrganization = async (
    data: OrganizationFormData & { logoUrl: string }
  ) => {
    if (!accessToken) return;

    const baseCurrency = data.baseCurrency || 'USD';

    const payload = {
      name: data.organizationName,
      slug: slugify(data.organizationName),
      display_name: data.organizationName,
      description: data.organizationDescription || '',
      website: data.websiteUrl || '',
      organization_type: data.organizationType,
      industry: data.industry,
      status: 'active',
      email: user?.email || '',
      phone: user?.phone || '',
      country: data.country || '',
      base_currency: baseCurrency,
      extra_data: {
        company_size: data.companySize,
        logo_url: data.logoUrl,
      },
      settings: {},
    };

    try {
      // Show loading spinner immediately
      setSettingUp(true);

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

      // Wait for the backend background thread to finish seeding currencies
      const confirmedCurrency = await waitForCurrencySeeded(accessToken, baseCurrency);

      // Update the currency store with the confirmed value
      useCurrencyStore.setState({
        baseCurrency: confirmedCurrency || baseCurrency,
        lastFetched: null, // Force fresh fetch on next access
      });

      setSettingUp(false);

      toast({
        title: 'Organization created',
        description: `${data.organizationName} has been set up successfully.`,
      });

      // Reload the app to ensure all components pick up the new currency
      window.location.href = '/';
    } catch (err) {
      setSettingUp(false);
      const message = err instanceof Error ? err.message : 'Failed to create organization. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Show loading overlay while setting up the organization
  if (settingUp) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#3058EE]" />
        <div className="text-center space-y-2 mt-4">
          <p className="text-lg font-semibold">Setting up your organization...</p>
          <p className="text-sm text-muted-foreground">
            Configuring currencies, chart of accounts, and default settings
          </p>
        </div>
      </div>
    );
  }

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
