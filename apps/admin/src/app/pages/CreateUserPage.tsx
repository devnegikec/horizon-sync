import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { toast } from '@horizon-sync/ui';
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

import { useCreateUser } from '../hooks/useCreateUser';

const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  organization_id: z.string().uuid('Invalid organization ID'),
  roles: z.array(z.enum(['system_admin', 'org_admin', 'user'])).optional(),
  phone: z.string().nullable().optional(),
  user_type: z.enum(['system_admin', 'organization_admin', 'user', 'guest']).optional(),
});

type UserCreateFormValues = z.infer<typeof userCreateSchema>;

const ROLE_OPTIONS: { value: 'system_admin' | 'org_admin' | 'user'; label: string }[] = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'user', label: 'User' },
];

export function CreateUserPage() {
  const navigate = useNavigate();
  const createMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      organization_id: '',
      roles: [],
      phone: '',
    },
  });

  const currentRoles = watch('roles') ?? [];

  const handleRoleToggle = (role: 'system_admin' | 'org_admin' | 'user', checked: boolean) => {
    const updated = checked
      ? [...currentRoles, role]
      : currentRoles.filter((r) => r !== role);
    setValue('roles', updated as UserCreateFormValues['roles'], { shouldValidate: true });
  };

  const onSubmit = (values: UserCreateFormValues) => {
    const payload = {
      email: values.email,
      password: values.password,
      first_name: values.first_name,
      last_name: values.last_name,
      organization_id: values.organization_id,
      roles: values.roles && values.roles.length > 0 ? values.roles : undefined,
      phone: values.phone || null,
      user_type: values.user_type,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast({
          title: 'User created',
          description: `${data.first_name} ${data.last_name} has been created successfully.`,
        });
        navigate(`/users/${data.id}`);
      },
      onError: (error: unknown) => {
        const err = error as Error & {
          status?: number;
          data?: { detail?: string | { field: string; message: string }[] };
        };
        if (err.status === 409) {
          setError('email', {
            message: 'User with this email already exists',
          });
        } else if (err.status === 422 && Array.isArray(err.data?.detail)) {
          for (const fieldErr of err.data.detail) {
            const fieldName = fieldErr.field as keyof UserCreateFormValues;
            if (fieldName in userCreateSchema.shape) {
              setError(fieldName, { message: fieldErr.message });
            }
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description:
              (err.data?.detail as string) ?? 'Failed to create user',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

              {/* Organization ID */}
              <div>
                <Label htmlFor="organization_id">Organization ID *</Label>
                <Input id="organization_id" placeholder="UUID" {...register('organization_id')} />
                {errors.organization_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.organization_id.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>

              {/* User Type */}
              <div>
                <Label>User Type</Label>
                <Select value={watch('user_type') ?? ''} onValueChange={(v) => setValue('user_type', v as UserCreateFormValues['user_type'])}>
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

              {/* Roles - checkboxes, full width */}
              <div className="sm:col-span-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {ROLE_OPTIONS.map((role) => (
                    <div key={role.value} className="flex items-center gap-2">
                      <Checkbox id={`role-${role.value}`} checked={currentRoles.includes(role.value)} onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)} />
                      <Label htmlFor={`role-${role.value}`} className="text-sm font-normal cursor-pointer">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
