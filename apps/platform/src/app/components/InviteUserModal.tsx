import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Send, Package, CreditCard, Users2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useAuth } from '../hooks';
import { UserService, InviteUserPayload } from '../services/user.service';

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  role_id: z.string().optional(),
  message: z.string().optional(),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Permission {
  id: string;
  label: string;
  checked: boolean;
}

interface PermissionGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
  });

  const [permissionGroups, setPermissionGroups] = React.useState<PermissionGroup[]>([
    {
      title: 'CRM & Sales',
      icon: Users2,
      permissions: [
        { id: 'view_leads', label: 'View Leads & Contacts', checked: false },
        { id: 'create_leads', label: 'Create Leads & Contacts', checked: false },
        { id: 'edit_leads', label: 'Edit Leads & Contacts', checked: false },
        { id: 'delete_leads', label: 'Delete Leads & Contacts', checked: false },
      ],
    },
    {
      title: 'Inventory Management',
      icon: Package,
      permissions: [
        { id: 'view_inventory', label: 'View Inventory', checked: false },
        { id: 'edit_items', label: 'Edit Items', checked: false },
        { id: 'create_items', label: 'Create Items', checked: false },
        { id: 'manage_transactions', label: 'Manage Transactions', checked: false },
      ],
    },
    {
      title: 'Billing & Subscriptions',
      icon: CreditCard,
      permissions: [
        { id: 'view_billing', label: 'View Billing', checked: false },
        { id: 'process_payments', label: 'Process Payments', checked: false },
        { id: 'manage_subscriptions', label: 'Manage Subscriptions', checked: false },
      ],
    },
  ]);

  const togglePermission = (groupIndex: number, permissionIndex: number) => {
    setPermissionGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex].permissions[permissionIndex].checked = !newGroups[groupIndex].permissions[permissionIndex].checked;
      return newGroups;
    });
  };

  const onSubmit = async (data: InviteUserFormData) => {
    if (!accessToken) {
      setErrorMessage('You must be logged in to invite users');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload: InviteUserPayload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role_id: data.role_id,
        message: data.message,
      };

      await UserService.inviteUser(payload, accessToken);

      // Reset form and close modal
      reset();
      setPermissionGroups((prev) =>
        prev.map((group) => ({
          ...group,
          permissions: group.permissions.map((p) => ({ ...p, checked: false })),
        })),
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Invite New User</DialogTitle>
              <DialogDescription>Send invitation with role and permissions</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">Invitation will be sent to this email</p>
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input id="first_name" placeholder="John" {...register('first_name')} className={errors.first_name ? 'border-destructive' : ''} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input id="last_name" placeholder="Doe" {...register('last_name')} className={errors.last_name ? 'border-destructive' : ''} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Assign Role */}
          <div className="space-y-2">
            <Label htmlFor="role_id">Assign Role</Label>
            <Select onValueChange={(value) => setValue('role_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select primary role for this user</p>
          </div>

          {/* Custom Permissions */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm">Custom Permissions</h3>
              <p className="text-xs text-muted-foreground">Override role permissions with custom access</p>
            </div>

            <div className="space-y-4">
              {permissionGroups.map((group, groupIndex) => (
                <div key={group.title} className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <group.icon className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">{group.title}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {group.permissions.map((permission, permissionIndex) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                          checked={permission.checked}
                          onCheckedChange={() => togglePermission(groupIndex, permissionIndex)}
                        />
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
