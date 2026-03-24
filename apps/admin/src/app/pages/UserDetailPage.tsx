import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Pencil, User, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { toast } from '@horizon-sync/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@horizon-sync/ui/components/ui/alert-dialog';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { useUser, useUpdateUser } from '../hooks/useUser';
import type { AdminUserDetailResponse } from '../types';

const userEditSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().nullable().optional(),
  user_type: z.enum(['system_admin', 'organization_admin', 'user', 'guest']).optional(),
  roles: z.array(z.enum(['system_admin', 'org_admin', 'user'])).optional(),
  is_active: z.boolean().optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

const ROLE_OPTIONS: { value: 'system_admin' | 'org_admin' | 'user'; label: string }[] = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'user', label: 'User' },
];

function dash(value: string | null | undefined): string {
  return value ?? '—';
}

function statusVariant(isActive: boolean) {
  return isActive ? 'default' : 'destructive';
}

function UserFields({ user }: { user: AdminUserDetailResponse }) {
  const displayName = user.display_name ?? `${user.first_name} ${user.last_name}`;

  const fields: { label: string; value: string | React.ReactNode }[] = [
    { label: 'Email', value: user.email },
    { label: 'Display Name', value: displayName },
    { label: 'First Name', value: user.first_name },
    { label: 'Last Name', value: user.last_name },
    { label: 'Phone', value: dash(user.phone) },
    { label: 'Roles', value: user.roles.length > 0 ? user.roles.join(', ') : '—' },
    { label: 'User Type', value: user.user_type },
    { label: 'Organization', value: dash(user.organization_name) },
    { label: 'Organization ID', value: dash(user.organization_id) },
    { label: 'Created At', value: user.created_at },
    { label: 'Updated At', value: dash(user.updated_at) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-sm font-medium text-muted-foreground">{f.label}</dt>
              <dd className="mt-1 text-sm">{f.value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <Badge variant={statusVariant(user.is_active)}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditForm({
  user,
  onCancel,
  onSuccess,
}: {
  user: AdminUserDetailResponse;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateUser();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [pendingData, setPendingData] = useState<UserEditFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone ?? '',
      user_type: user.user_type as UserEditFormValues['user_type'],
      roles: (user.roles as UserEditFormValues['roles']) ?? [],
      is_active: user.is_active,
    },
  });

  const currentIsActive = watch('is_active');
  const currentRoles = watch('roles') ?? [];

  const submitUpdate = (values: UserEditFormValues) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone || null,
      user_type: values.user_type,
      roles: values.roles,
      is_active: values.is_active,
    };

    updateMutation.mutate(
      { id: user.id, data: payload },
      {
        onSuccess: () => {
          toast({ title: 'User updated', description: 'Changes saved successfully.' });
          onSuccess();
        },
        onError: (error: unknown) => {
          const err = error as Error & { status?: number; data?: { detail?: string | { field: string; message: string }[] } };
          if (err.status === 409) {
            setError('first_name', { message: 'User with this email already exists' });
          } else if (err.status === 422 && Array.isArray(err.data?.detail)) {
            for (const fieldErr of err.data.detail) {
              const fieldName = fieldErr.field as keyof UserEditFormValues;
              if (fieldName in userEditSchema.shape) {
                setError(fieldName, { message: fieldErr.message });
              }
            }
          } else if (err.status === 404) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found' });
          } else {
            toast({ variant: 'destructive', title: 'Error', description: (err.data?.detail as string) ?? 'Failed to update user' });
          }
        },
      }
    );
  };

  const onSubmit = (values: UserEditFormValues) => {
    if (values.is_active === false && user.is_active === true) {
      setPendingData(values);
      setShowDeactivateDialog(true);
      return;
    }
    submitUpdate(values);
  };

  const confirmDeactivate = () => {
    setShowDeactivateDialog(false);
    if (pendingData) {
      submitUpdate(pendingData);
      setPendingData(null);
    }
  };

  const handleRoleToggle = (role: 'system_admin' | 'org_admin' | 'user', checked: boolean) => {
    const updated = checked
      ? [...currentRoles, role]
      : currentRoles.filter((r) => r !== role);
    setValue('roles', updated as UserEditFormValues['roles'], { shouldValidate: true });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </span>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Email - read only */}
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              {/* First Name */}
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>

              {/* User Type */}
              <div>
                <Label>User Type</Label>
                <Select value={watch('user_type')} onValueChange={(v) => setValue('user_type', v as UserEditFormValues['user_type'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_admin">System Admin</SelectItem>
                    <SelectItem value="organization_admin">Organization Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Status */}
              <div>
                <Label>Active Status</Label>
                <Select value={currentIsActive ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_active', v === 'true')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Roles - checkboxes, full width */}
              <div className="sm:col-span-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {ROLE_OPTIONS.map((role) => (
                    <div key={role.value} className="flex items-center gap-2">
                      <Checkbox id={`role-${role.value}`}
                        checked={currentRoles.includes(role.value)}
                        onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}/>
                      <Label htmlFor={`role-${role.value}`} className="text-sm font-normal cursor-pointer">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this user? They will no longer be able to access the platform.
              This action can be reversed by setting the user back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeactivateDialog(false); setPendingData(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              Confirm Deactivation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UserNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <User className="h-12 w-12 mb-4" />
      <p className="text-lg font-medium">User not found</p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>
    </div>
  );
}

function UserHeader({
  user,
  isLoading,
  editing,
  onBack,
  onEdit,
}: {
  user?: AdminUserDetailResponse;
  isLoading: boolean;
  editing: boolean;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : user ? (
            user.display_name ?? `${user.first_name} ${user.last_name}`
          ) : null}
        </h1>
        {user && (
          <Badge variant={statusVariant(user.is_active)}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>
      {!editing && !isLoading && user && (
        <Button onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}
    </div>
  );
}

function UserContent({
  user,
  isLoading,
  editing,
  onCancel,
  onSuccess,
}: {
  user?: AdminUserDetailResponse;
  isLoading: boolean;
  editing: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  if (isLoading) return <DetailSkeleton />;
  if (!user) return null;
  if (editing) return <EditForm user={user} onCancel={onCancel} onSuccess={onSuccess} />;
  return <UserFields user={user} />;
}

export function UserDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data: user, isLoading, isError, error } = useUser(id);

  const is404 = isError && (error as Error & { status?: number })?.status === 404;

  if (is404) {
    return <UserNotFound onBack={() => navigate('/users')} />;
  }

  return (
    <div className="space-y-6">
      <UserHeader user={user} isLoading={isLoading} editing={editing} onBack={() => navigate('/users')} onEdit={() => setEditing(true)} />
      <UserContent user={user} isLoading={isLoading} editing={editing} onCancel={() => setEditing(false)} onSuccess={() => setEditing(false)} />
    </div>
  );
}
