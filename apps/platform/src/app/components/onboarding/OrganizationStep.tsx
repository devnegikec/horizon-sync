import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { OrganizationForm, OrganizationService, type CreateOrganizationPayload, type OrganizationFormData } from '@horizon-sync/ui/components';
import { useCurrencyStore } from '@horizon-sync/store';

import { environment } from '../../../environments/environment';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingStore } from '../../hooks/useOnboardingStore';

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
        // Check if currencies are seeded AND base_currency matches what we sent
        if (data.currencies?.length > 0 && data.base_currency) {
          // If the expected currency matches OR currencies are seeded (org might use USD)
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
  return null; // Timed out
}

export function OrganizationStep() {
  const { user, accessToken } = useAuth();
  const { data, updateData, setCurrentStep } = useOnboardingStore();
  const [settingUp, setSettingUp] = React.useState(false);

  const handleSubmit = async (formData: OrganizationFormData & { logoUrl: string }) => {
    try {
      if (accessToken) {
        const slug = formData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const baseCurrency = formData.baseCurrency || 'USD';

        const payload: CreateOrganizationPayload = {
          name: formData.organizationName,
          display_name: formData.organizationName,
          slug: slug || `org-${Math.random().toString(36).substring(2, 11)}`,
          description: formData.organizationDescription || '',
          website: formData.websiteUrl || '',
          industry: formData.industry,
          organization_type: formData.organizationType,
          status: 'trial',
          email: user?.email || '',
          phone: user?.phone || '',
          country: formData.country || '',
          base_currency: baseCurrency,
          extra_data: {
            company_size: formData.companySize,
            logo_url: formData.logoUrl,
          },
          settings: {},
        };

        // Create the organization (triggers background seeding)
        await OrganizationService.createOrganization(
          payload,
          accessToken,
          environment.apiBaseUrl
        );

        // Show loading state while backend seeds currencies, chart of accounts, etc.
        setSettingUp(true);

        // Wait for the backend background thread to finish seeding
        const confirmedCurrency = await waitForCurrencySeeded(accessToken, baseCurrency);

        // Update the currency store with the confirmed value
        useCurrencyStore.setState({
          baseCurrency: confirmedCurrency || baseCurrency,
          lastFetched: null, // Force fresh fetch on next access
        });
      }

      updateData({
        organizationName: formData.organizationName,
        industry: formData.industry,
        companySize: formData.companySize,
        organizationDescription: formData.organizationDescription,
        websiteUrl: formData.websiteUrl,
        logoUrl: formData.logoUrl,
      });

      setSettingUp(false);
      setCurrentStep(3);
    } catch (error) {
      setSettingUp(false);
      console.error('Failed to create organization:', error);
      const message = error instanceof Error ? error.message : 'Failed to create organization. Please try again.';
      throw new Error(message);
    }
  };

  if (settingUp) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#3058EE]" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Setting up your organization...</p>
          <p className="text-sm text-muted-foreground">
            Configuring currencies, chart of accounts, and default settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <OrganizationForm
      onSubmit={handleSubmit}
      onBack={() => setCurrentStep(1)}
      showBackButton={true}
      submitButtonText="Create Organization"
      defaultValues={{
        organizationName: data.organizationName,
        industry: data.industry,
        companySize: data.companySize,
        organizationDescription: data.organizationDescription,
        websiteUrl: data.websiteUrl,
        logoUrl: data.logoUrl,
      }}
    />
  );
}
