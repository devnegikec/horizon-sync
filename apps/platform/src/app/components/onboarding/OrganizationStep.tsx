import * as React from 'react';

import { OrganizationForm, OrganizationService, type CreateOrganizationPayload } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingStore } from '../../hooks/useOnboardingStore';

export function OrganizationStep() {
  const { user, accessToken } = useAuth();
  const { data, updateData, setCurrentStep } = useOnboardingStore();

  const handleSubmit = async (formData: any) => {
    try {
      if (accessToken) {
        // Simple slug generation
        const slug = formData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const payload: CreateOrganizationPayload = {
          name: formData.organizationName,
          display_name: formData.organizationName,
          slug: slug || `org-${Math.random().toString(36).substring(2, 11)}`,
          description: formData.organizationDescription || '',
          website: formData.websiteUrl || '',
          industry: formData.industry,
          organization_type: 'business',
          status: 'trial',
          email: user?.email || '',
          phone: user?.phone || '',
          extra_data: {
            company_size: formData.companySize,
            logo_url: formData.logoUrl,
          },
          settings: {},
        };

        await OrganizationService.createOrganization(
          payload,
          accessToken,
          environment.apiBaseUrl
        );
      }

      updateData({
        organizationName: formData.organizationName,
        industry: formData.industry,
        companySize: formData.companySize,
        organizationDescription: formData.organizationDescription,
        websiteUrl: formData.websiteUrl,
        logoUrl: formData.logoUrl,
      });
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  };

  return (
    <OrganizationForm
      onSubmit={handleSubmit}
      onBack={() => setCurrentStep(1)}
      showBackButton={true}
      submitButtonText="Continue to Invitations"
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
