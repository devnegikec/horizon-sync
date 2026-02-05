import * as React from 'react';

import { Users, UserCheck, UserLockIcon, Shield, Download, UserPlus, Key, Mail, MoreHorizontal, Clock } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import { InviteUserModal } from '../components/InviteUserModal';
import { useAuth } from '../hooks';
import { UserService, User } from '../services/user.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning';
  };
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, badge }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {badge && (
                <Badge variant={badge.variant} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadgeProps(status: string): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  label: string;
} {
  switch (status) {
    case 'active':
      return { variant: 'success', label: 'Active' };
    case 'pending':
      return { variant: 'warning', label: 'Pending' };
    case 'inactive':
      return { variant: 'secondary', label: 'Inactive' };
    case 'suspended':
      return { variant: 'destructive', label: 'Suspended' };
    default:
      return { variant: 'secondary', label: status };
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UserManagementPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState({
    total: 0,
    active: 0,
    pending: 0,
    mfaEnabled: 0,
  });

  const fetchUsers = React.useCallback(async () => {
    if (!accessToken) {
      setError('You must be logged in to view users');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await UserService.getUsers(1, 20, accessToken);
      setUsers(data.items);

      // Calculate stats
      const activeUsers = data.items.filter((u) => u.status === 'active').length;
      const pendingUsers = data.items.filter((u) => u.status === 'pending').length;
      const mfaUsers = data.items.filter((u) => u.mfa_enabled).length;

      setStats({
        total: data.total,
        active: activeUsers,
        pending: pendingUsers,
        mfaEnabled: mfaUsers,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteSuccess = () => {
    fetchUsers(); // Refresh the user list
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3058EE]/20 border-t-[#3058EE]" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setInviteModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users"
          value={stats.total}
          icon={Users}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
          badge={{ text: '+12%', variant: 'success' }}/>
        <StatCard title="Active Users"
          value={stats.active}
          icon={UserCheck}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Pending Invites"
          value={stats.pending}
          icon={UserLockIcon}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
        <StatCard title="MFA Enabled" value={stats.mfaEnabled} icon={Shield} iconBg="bg-[#3058EE]/10" iconColor="text-[#3058EE]" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const statusBadge = getStatusBadgeProps(user.status);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white font-medium">
                              {getUserInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {user.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(user.last_login_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite User Modal */}
      <InviteUserModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} onSuccess={handleInviteSuccess} />
    </div>
  );
}
