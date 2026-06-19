import * as React from 'react';

import {
  AtSign,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Shield,
  ShieldCheck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@horizon-sync/ui/components';
import { getStatusBadgeProps, getUserInitials } from '@horizon-sync/ui';

import type { User } from '../../types/user.types';

interface UserViewDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UserViewDialog({ user, isOpen, onClose }: UserViewDialogProps) {
  if (!user) return null;

  const statusBadge = getStatusBadgeProps(user.status);
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={user.avatar_url ?? ''} />
              <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-lg font-semibold">
                {getUserInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl truncate">{fullName}</DialogTitle>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={statusBadge.variant} className="text-xs">
                  {statusBadge.label}
                </Badge>
                {user.email_verified ? (
                  <Badge variant="success" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <XCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                {user.mfa_enabled && (
                  <Badge variant="default" className="text-xs gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    MFA On
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {/* Identity */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Identity
          </p>
          <InfoRow
            icon={UserIcon}
            label="Full Name"
            value={fullName}
          />
          <InfoRow
            icon={AtSign}
            label="Email"
            value={user.email}
          />
          {user.phone && (
            <InfoRow
              icon={Phone}
              label="Phone"
              value={user.phone}
            />
          )}
          <InfoRow
            icon={Shield}
            label="User Type"
            value={
              <span className="capitalize">
                {user.user_type.replace(/_/g, ' ')}
              </span>
            }
          />

          <Separator className="my-3" />

          {/* Roles */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Assigned Roles
          </p>
          {user.roles && user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 py-2">
              {user.roles.map(role => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No roles assigned</p>
          )}

          {/* Warehouse Assignments (shown for WMS roles) */}
          {user.extra_data && Array.isArray(user.extra_data.warehouse_ids) && (user.extra_data.warehouse_ids as string[]).length > 0 && (
            <div className="mt-2 rounded-md border bg-muted/30 p-2.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assigned Warehouses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(user.extra_data.warehouse_ids as string[]).map((id) => (
                  <Badge key={id} variant="outline" className="text-xs font-mono">
                    {id.length > 12 ? `${id.slice(0, 8)}…` : id}
                  </Badge>
                ))}
              </div>
              {typeof user.extra_data?.warehouse_role === 'string' && (
                <p className="text-[10px] text-muted-foreground">
                  Warehouse role: <span className="font-medium capitalize">{user.extra_data.warehouse_role}</span>
                </p>
              )}
            </div>
          )}

          <Separator className="my-3" />

          {/* Activity */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Activity
          </p>
          <InfoRow
            icon={Clock}
            label="Last Login"
            value={formatDate(user.last_login_at)}
          />
          <InfoRow
            icon={Calendar}
            label="Member Since"
            value={formatDate(user.created_at)}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
