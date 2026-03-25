import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { User, Pencil, Save, X, Shield, Mail, Phone, Building2, Calendar, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { getStatusBadgeProps, getUserTypeBadge, formatUserDate, formatShortDate } from '../../utils/user-utils';

/** Minimal user shape for the detail modal */
export interface UserDetailData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  user_type: string;
  roles?: string[];
  is_active?: boolean;
  status?: string;
  organization_id?: string | null;
  organization_name?: string | null;
  display_name?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface UserDetailModalConfig {
  showUserType?: boolean;
  showRoles?: boolean;
  showPhone?: boolean;
  showOrganization?: boolean;
  showStatus?: boolean;
  allowEdit?: boolean;
  allowDeactivate?: boolean;
  initialEditMode?: boolean;
}

export interface UserDetailEditData {
  first_name: string;
  last_name: string;
  phone?: string;
  user_type?: string;
  roles?: string[];
  is_active?: boolean;
}

export interface UserDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetailData | null;
  loading?: boolean;
  onUpdate?: (userId: string, data: UserDetailEditData) => Promise<void>;
  config?: UserDetailModalConfig;
}

const ROLE_OPTIONS = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'user', label: 'User' },
] as const;

const USER_TYPE_OPTIONS = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'organization_admin', label: 'Organization Admin' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' },
] as const;

const editSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  user_type: z.string().optional(),
  roles: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value || '—'}</div>
      </div>
    </div>
  );
}

function ViewMode({ user, config, onEdit }: { user: UserDetailData; config: UserDetailModalConfig; onEdit?: () => void }) {
  const statusBadge = getStatusBadgeProps(user.status ?? user.is_active ?? 'unknown');
  const typeBadge = getUserTypeBadge(user.user_type);

  return (
    <div className="space-y-4">
      {/* User header with avatar */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-lg font-semibold">
          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">{user.first_name} {user.last_name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
          </div>
        </div>
        {config.allowEdit && onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </div>

      <Separator />

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        {config.showPhone && <InfoRow icon={Phone} label="Phone" value={user.phone} />}
        {config.showOrganization && <InfoRow icon={Building2} label="Organization" value={user.organization_name} />}
        {config.showUserType && <InfoRow icon={Shield} label="User Type" value={typeBadge.label} />}
        {config.showRoles && (
          <InfoRow icon={Shield} label="Roles" value={
            user.roles && user.roles.length > 0
              ? <div className="flex flex-wrap gap-1">{user.roles.map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}</div>
              : '—'
          } />
        )}
        {user.created_at && <InfoRow icon={Calendar} label="Created" value={formatShortDate(user.created_at)} />}
        {user.updated_at && <InfoRow icon={Clock} label="Updated" value={formatUserDate(user.updated_at)} />}
      </div>
    </div>
  );
}

function EditMode({ user, config, onSave, onCancel }: {
  user: UserDetailData;
  config: UserDetailModalConfig;
  onSave: (data: UserDetailEditData) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserDetailEditData>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone ?? '',
      user_type: user.user_type,
      roles: user.roles ?? [],
      is_active: user.is_active ?? true,
    },
  });

  const currentRoles = watch('roles') ?? [];

  const handleRoleToggle = (role: string, checked: boolean) => {
    const updated = checked ? [...currentRoles, role] : currentRoles.filter(r => r !== role);
    setValue('roles', updated, { shouldValidate: true });
  };

  const doSave = handleSubmit(
    async (data: UserDetailEditData) => {
      setIsSubmitting(true);
      setErrorMessage('');
      try {
        await onSave(data);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to update user');
      } finally {
        setIsSubmitting(false);
      }
    },
    (validationErrors) => {
      console.error('Form validation errors:', validationErrors);
    }
  );

  return (
    <div className="space-y-5">
      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label>Email Address</Label>
        <Input value={user.email} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ud-first">First Name <span className="text-destructive">*</span></Label>
          <Input id="ud-first" {...register('first_name')} className={errors.first_name ? 'border-destructive' : ''} />
          {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ud-last">Last Name <span className="text-destructive">*</span></Label>
          <Input id="ud-last" {...register('last_name')} className={errors.last_name ? 'border-destructive' : ''} />
          {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Phone + User Type */}
      {(config.showPhone || config.showUserType) && (
        <div className="grid grid-cols-2 gap-4">
          {config.showPhone && (
            <div className="space-y-2">
              <Label htmlFor="ud-phone">Phone</Label>
              <Input id="ud-phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
            </div>
          )}
          {config.showUserType && (
            <div className="space-y-2">
              <Label>User Type</Label>
              <Select value={watch('user_type') ?? ''} onValueChange={v => setValue('user_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {USER_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Roles */}
      {config.showRoles && (
        <div className="space-y-3">
          <Label>Roles</Label>
          <div className="rounded-lg border border-border p-4">
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map(role => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox id={`ud-role-${role.value}`} checked={currentRoles.includes(role.value)}
                    onCheckedChange={checked => handleRoleToggle(role.value, !!checked)} />
                  <label htmlFor={`ud-role-${role.value}`} className="text-sm font-normal leading-none cursor-pointer">{role.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active toggle */}
      {config.allowDeactivate && (
        <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
          <Checkbox id="ud-active" checked={watch('is_active')} onCheckedChange={checked => setValue('is_active', !!checked)} />
          <label htmlFor="ud-active" className="text-sm font-medium leading-none cursor-pointer">User is active</label>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{errorMessage}</div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="button" disabled={isSubmitting} onClick={() => doSave()}
          className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
          {isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function UserDetailModal({ open, onOpenChange, user, loading, onUpdate, config = {} }: UserDetailModalProps) {
  const {
    showUserType = false, showRoles = false, showPhone = false,
    showOrganization = false, showStatus = true,
    allowEdit = false, allowDeactivate = false, initialEditMode = false,
  } = config;
  const resolvedConfig = { showUserType, showRoles, showPhone, showOrganization, showStatus, allowEdit, allowDeactivate };

  const [editing, setEditing] = React.useState(false);

  // Set edit mode based on initialEditMode when modal opens
  React.useEffect(() => {
    if (open) {
      setEditing(initialEditMode);
    } else {
      setEditing(false);
    }
  }, [open, initialEditMode]);

  const handleSave = async (data: UserDetailEditData) => {
    if (!user || !onUpdate) return;
    await onUpdate(user.id, data);
    setEditing(false);
  };

  const handleCancel = () => {
    if (config.initialEditMode) {
      // If opened directly in edit mode, close the modal on cancel
      onOpenChange(false);
    } else {
      // If switched to edit mode from view, go back to view mode
      setEditing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{editing ? 'Edit User' : 'User Details'}</DialogTitle>
              <DialogDescription>{editing ? 'Update user information' : 'View user profile and details'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-56" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          </div>
        ) : !user ? (
          <div className="py-8 text-center text-muted-foreground">User not found</div>
        ) : editing ? (
          <EditMode user={user} config={resolvedConfig} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <>
            <ViewMode user={user} config={resolvedConfig} onEdit={allowEdit ? () => setEditing(true) : undefined} />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
