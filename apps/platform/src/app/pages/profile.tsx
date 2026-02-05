import * as React from 'react';

import { User, Mail, Phone, Globe, Clock, Building2, Shield, CheckCircle2, XCircle, Calendar } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { useAuth } from '../hooks';

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'destructive' | 'secondary';
  };
}

function InfoRow({ icon: Icon, label, value, badge }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{value || 'Not set'}</p>
        </div>
      </div>
      {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
    </div>
  );
}

function getStatusBadge(status?: string): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  text: string;
} {
  switch (status) {
    case 'active':
      return { variant: 'success', text: 'Active' };
    case 'pending':
      return { variant: 'warning', text: 'Pending' };
    case 'inactive':
      return { variant: 'secondary', text: 'Inactive' };
    case 'suspended':
      return { variant: 'destructive', text: 'Suspended' };
    default:
      return { variant: 'secondary', text: status || 'Unknown' };
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getUserInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
}

interface ProfileHeaderProps {
  user: {
    avatar_url?: string | null;
    display_name?: string;
    email: string;
    first_name: string;
    last_name: string;
    status?: string;
    email_verified?: boolean;
    user_type?: string;
    is_active?: boolean;
  };
}

function ProfileHeader({ user }: ProfileHeaderProps) {
  const statusBadge = getStatusBadge(user.status);
  const userInitials = getUserInitials(user.first_name, user.last_name, user.email);

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
            <AvatarImage src={user.avatar_url || ''} alt={user.display_name || user.email} />
            <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-2xl font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">{user.display_name || `${user.first_name} ${user.last_name}`}</h2>
              <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
              {user.email_verified && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {!user.email_verified && (
                <Badge variant="warning" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-normal">
                {user.user_type || 'User'}
              </Badge>
              {user.is_active && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active Account
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const { user } = useAuth();

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
            <InfoRow icon={Shield}
              label="Account Status"
              value={user.status}
              badge={statusBadge}/>
            <InfoRow icon={CheckCircle2}
              label="Email Verification"
              value={user.email_verified ? 'Verified' : 'Not Verified'}
              badge={
                user.email_verified
                  ? { text: 'Verified', variant: 'success' }
                  : { text: 'Pending', variant: 'warning' }
              }/>
            <InfoRow icon={Calendar}
              label="Email Verified At"
              value={user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'}/>
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
              Organization & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow icon={Building2}
              label="Organization ID"
              value={user.organization_id || 'No organization'}
              badge={
                user.organization_id
                  ? { text: 'Linked', variant: 'success' }
                  : { text: 'Not Linked', variant: 'secondary' }
              }/>
            <InfoRow icon={Clock} label="Last Login" value={formatDate(user.last_login_at)} />
            <InfoRow icon={Globe} label="Last Login IP" value={user.last_login_ip} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
