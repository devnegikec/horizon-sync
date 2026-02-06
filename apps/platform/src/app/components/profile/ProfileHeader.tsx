import * as React from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';

import { getStatusBadge, getUserInitials } from '../../utility/profile-utils';

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

export function ProfileHeader({ user }: ProfileHeaderProps) {
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
