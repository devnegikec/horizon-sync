import * as React from 'react';

import { Building2, Mail, Phone, Globe, MapPin, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { useOrganization } from '../../hooks/useOrganization';
import { formatDate } from '../../utility/profile-utils';

import { InfoRow } from './InfoRow';

interface OrganizationCardProps {
  organizationId: string;
  accessToken: string;
}

export function OrganizationCard({ organizationId, accessToken }: OrganizationCardProps) {
  const { organization, loading, error } = useOrganization(organizationId, accessToken);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3058EE]/20 border-t-[#3058EE]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return null;
  }

  const getOrgStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return { text: 'Active', variant: 'success' as const };
      case 'inactive':
        return { text: 'Inactive', variant: 'secondary' as const };
      case 'suspended':
        return { text: 'Suspended', variant: 'destructive' as const };
      default:
        return { text: status || 'Unknown', variant: 'secondary' as const };
    }
  };

  const statusBadge = getOrgStatusBadge(organization.status);

  return (
    <Card className="border-border md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          Organization Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <InfoRow icon={Building2} label="Organization Name" value={organization.name} />
        <InfoRow icon={Building2} label="Display Name" value={organization.display_name} />
        <InfoRow icon={Building2} label="Status" value={organization.status} badge={statusBadge} />
        <InfoRow icon={Building2} label="Type" value={organization.organization_type} />
        <InfoRow icon={Building2} label="Industry" value={organization.industry} />
        {organization.email && <InfoRow icon={Mail} label="Email" value={organization.email} />}
        {organization.phone && <InfoRow icon={Phone} label="Phone" value={organization.phone} />}
        {organization.website && <InfoRow icon={Globe} label="Website" value={organization.website} />}
        {organization.address && <InfoRow icon={MapPin} label="Address" value={organization.address} />}
        <InfoRow icon={Calendar} label="Created At" value={formatDate(organization.created_at)} />
      </CardContent>
    </Card>
  );
}
