import * as React from 'react';

import { User, Mail, Phone, Globe, Clock, Building2, Shield, CheckCircle2, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { InfoRow, OrganizationCard, ProfileHeader } from '../components/profile';
import { useAuth } from '../hooks';
import { formatDate, getStatusBadge } from '../utility/profile-utils';

export function ProfilePage() {
  const { user, accessToken } = useAuth();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <User className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No user data available</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(user.status);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">View and manage your personal information</p>
      </div>

      {/* Profile Header Card */}
      <ProfileHeader user={user} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
                <User className="h-5 w-5 text-white" />
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={User} label="First Name" value={user.first_name} />
            <InfoRow icon={User} label="Last Name" value={user.last_name} />
            <InfoRow icon={Mail} label="Email Address" value={user.email} />
            <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Shield} label="Account Status" value={user.status} badge={statusBadge} />
            <InfoRow icon={CheckCircle2}
              label="Email Verification"
              value={user.email_verified ? 'Verified' : 'Not Verified'}
              badge={user.email_verified ? { text: 'Verified', variant: 'success' } : { text: 'Pending', variant: 'warning' }}/>
            <InfoRow icon={Calendar} label="Email Verified At" value={user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'} />
          </CardContent>
        </Card>

        {/* Preferences & Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600">
                <Globe className="h-5 w-5 text-white" />
              </div>
              Preferences & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Clock} label="Timezone" value={user.timezone} />
            <InfoRow icon={Globe} label="Language" value={user.language?.toUpperCase()} />
          </CardContent>
        </Card>

        {/* Organization & Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Clock} label="Last Login" value={formatDate(user.last_login_at)} />
            <InfoRow icon={Globe} label="Last Login IP" value={user.last_login_ip} />
          </CardContent>
        </Card>

        {/* Organization Details - Full width if organization exists */}
        {user.organization_id && accessToken && <OrganizationCard organizationId={user.organization_id} accessToken={accessToken} />}
      </div>
    </div>
  );
}
