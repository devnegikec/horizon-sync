import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Send, Plus, Search, Check, ChevronsUpDown, Building2, Shield } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

/** Field configuration — each field can be shown/hidden and made required/optional */
export interface CreateUserModalConfig {
  /** Show password field (admin creates with password; org invites without) */
  showPassword?: boolean;
  /** Show organization select (admin assigns org; org users inherit theirs) */
  showOrganization?: boolean;
  /** Organization options for the searchable select */
  organizationOptions?: Array<{ id: string; name: string }>;
  /** Loading state for organization options */
  organizationsLoading?: boolean;
  /** Callback when user types in the organization search — parent can filter/fetch */
  onOrganizationSearch?: (query: string) => void;
  /** Show user_type dropdown */
  showUserType?: boolean;
  /** Show roles checkboxes */
  showRoles?: boolean;
  /** Show phone field */
  showPhone?: boolean;
  /** Show role_id dropdown (for org invite flow) */
  showRoleSelect?: boolean;
  /** Show message/note textarea */
  showMessage?: boolean;
  /** Custom role options for the role_id select */
  roleOptions?: Array<{ id: string; name: string; description?: string }>;
  /** Loading state for role options */
  rolesLoading?: boolean;
  /** System admin role options for the role selector (shown when user_type = system_admin) */
  systemAdminRoles?: SystemAdminRoleOption[];
  /** Loading state for system admin roles */
  systemAdminRolesLoading?: boolean;
  /** Master organization ID — auto-selected when user_type is system_admin */
  masterOrganizationId?: string;
  /** Master organization display name */
  masterOrganizationName?: string;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Submit button icon variant */
  submitIcon?: 'send' | 'plus';
}

export interface CreateUserModalFormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  organization_id?: string;
  user_type?: string;
  roles?: string[];
  phone?: string;
  role_id?: string;
  message?: string;
  system_admin_role_ids?: string[];
}

/** A system admin role with its associated permissions, used for the role selector. */
export interface SystemAdminRoleOption {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissions: Array<{ id: string; code: string; name: string; description: string | null }>;
}

export interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserModalFormData) => Promise<void>;
  config?: CreateUserModalConfig;
  /** Set a field-level error from the parent (e.g. 409 duplicate email) */
  fieldError?: { field: string; message: string } | null;
  /** When true, system_admin options are shown in USER_TYPE_OPTIONS and ROLE_CHECKBOX_OPTIONS.
   *  When false/undefined, system_admin options are filtered out. */
  isSuperAdmin?: boolean;
}

const ROLE_CHECKBOX_OPTIONS = [
  { value: 'system_admin', label: 'System Admin', description: 'Full system-level access across all organizations' },
  { value: 'org_admin', label: 'Organization Admin', description: 'Full access to all resources within the assigned organization (inventory, invoices, users, settings)' },
  { value: 'user', label: 'User', description: 'Standard access with permissions defined by assigned roles within the organization' },
] as const;

const USER_TYPE_OPTIONS = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'organization_admin', label: 'Organization Admin' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' },
] as const;

function buildSchema(config: CreateUserModalConfig) {
  const shape: Record<string, z.ZodTypeAny> = {
    email: z.email('Please enter a valid email address'),
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  };
  if (config.showPassword) {
    shape.password = z.string().min(8, 'Password must be at least 8 characters');
  }
  if (config.showOrganization) {
    shape.organization_id = z.string().min(1, 'Please select an organization');
  }
  if (config.showUserType) {
    shape.user_type = z.string().optional();
  }
  if (config.showRoles) {
    shape.roles = z.array(z.string()).optional();
  }
  if (config.showPhone) {
    shape.phone = z.string().optional();
  }
  if (config.showRoleSelect) {
    shape.role_id = z.string().optional();
  }
  if (config.showMessage) {
    shape.message = z.string().optional();
  }
  // Always allow system_admin_role_ids to pass through
  shape.system_admin_role_ids = z.array(z.string()).optional();
  return z.object(shape);
}

function OrgSearchField({
  options,
  loading,
  value,
  onChange,
  onSearch,
  error,
}: {
  options: Array<{ id: string; name: string }>;
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
  onSearch?: (query: string) => void;
  error?: string;
}) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOrg = options.find((o) => o.id === value);

  const filtered = React.useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(q), 300);
    }
  };

  React.useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="space-y-2">
      <Label>Organization <span className="text-destructive">*</span></Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={popoverOpen}
            className={`w-full justify-between font-normal ${!selectedOrg ? 'text-muted-foreground' : ''} ${error ? 'border-destructive' : ''}`}>
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selectedOrg ? selectedOrg.name : 'Search and select organization...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading organizations...</p>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No organizations found</p>
            ) : (
              filtered.map((org) => (
                <button key={org.id} type="button"
                  onClick={() => { onChange(org.id); setPopoverOpen(false); setSearchQuery(''); }}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                  <Check className={`mr-2 h-4 w-4 ${value === org.id ? 'opacity-100' : 'opacity-0'}`} />
                  {org.name}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Search and select the organization this user belongs to</p>
    </div>
  );
}

export function CreateUserModal({
  open,
  onOpenChange,
  onSubmit,
  config = {},
  fieldError,
  isSuperAdmin = false,
}: CreateUserModalProps) {
  const {
    showPassword = false,
    showOrganization = false,
    organizationOptions = [],
    organizationsLoading = false,
    onOrganizationSearch,
    showUserType = false,
    showRoles = false,
    showPhone = false,
    showRoleSelect = false,
    showMessage = false,
    roleOptions = [],
    rolesLoading = false,
    systemAdminRoles = [],
    systemAdminRolesLoading = false,
    masterOrganizationId = '',
    masterOrganizationName = 'Master Organization',
    title = 'Create New User',
    description = 'Fill in the details to create a new user',
    submitLabel = 'Create User',
    submitIcon = 'plus',
  } = config;

  // Filter out system_admin options when the current user is not a Super Admin
  const filteredUserTypeOptions = React.useMemo(
    () => isSuperAdmin ? USER_TYPE_OPTIONS : USER_TYPE_OPTIONS.filter((opt) => opt.value !== 'system_admin'),
    [isSuperAdmin]
  );
  const filteredRoleCheckboxOptions = React.useMemo(
    () => isSuperAdmin ? ROLE_CHECKBOX_OPTIONS : ROLE_CHECKBOX_OPTIONS.filter((opt) => opt.value !== 'system_admin'),
    [isSuperAdmin]
  );

  const schema = React.useMemo(() => buildSchema(config), [
    showPassword, showOrganization, showUserType, showRoles,
    showPhone, showRoleSelect, showMessage,
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateUserModalFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: '', first_name: '', last_name: '', password: '',
      organization_id: '', phone: '', roles: [], message: '',
      system_admin_role_ids: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const currentRoles = watch('roles') ?? [];
  const currentUserType = watch('user_type') ?? '';
  const currentOrgId = watch('organization_id') ?? '';
  const currentSystemAdminRoleIds = watch('system_admin_role_ids') ?? [];

  // Determine if selected org is the master org
  const isSelectedOrgMaster = !!(masterOrganizationId && currentOrgId === masterOrganizationId);

  // Apply external field errors
  React.useEffect(() => {
    if (fieldError) {
      setError(fieldError.field as keyof CreateUserModalFormData, { message: fieldError.message });
    }
  }, [fieldError, setError]);

  // Auto-switch user_type based on selected organization
  const isSystemAdmin = currentUserType === 'system_admin';
  React.useEffect(() => {
    if (isSelectedOrgMaster && currentUserType !== 'system_admin') {
      // Master org selected → force system_admin user type
      setValue('user_type', 'system_admin');
      setValue('roles', []);
      setValue('system_admin_role_ids', []);
    } else if (!isSelectedOrgMaster && currentUserType === 'system_admin') {
      // Switched away from master org → clear system_admin type
      setValue('user_type', 'organization_admin');
      setValue('system_admin_role_ids', []);
    }
  }, [isSelectedOrgMaster, currentUserType, setValue]);

  const handleRoleToggle = (role: string, checked: boolean) => {
    const updated = checked ? [...currentRoles, role] : currentRoles.filter((r) => r !== role);
    setValue('roles', updated, { shouldValidate: true });
  };

  const handleSystemAdminRoleToggle = (roleId: string, checked: boolean) => {
    const updated = checked
      ? [...currentSystemAdminRoleIds, roleId]
      : currentSystemAdminRoleIds.filter((id) => id !== roleId);
    setValue('system_admin_role_ids', updated);
  };

  const handleFormSubmit = async (data: CreateUserModalFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage('');
    onOpenChange(false);
  };

  const SubmitIcon = submitIcon === 'send' ? Send : Plus;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit, (validationErrors) => {
          console.error('Form validation errors:', validationErrors);
          // Show first validation error as the error message
          const firstError = Object.values(validationErrors)[0];
          if (firstError?.message) {
            setErrorMessage(String(firstError.message));
          }
        })} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="cu-email">Email Address <span className="text-destructive">*</span></Label>
            <Input id="cu-email" type="email" placeholder="user@example.com"
              {...register('email')} className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* First / Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cu-first">First Name <span className="text-destructive">*</span></Label>
              <Input id="cu-first" placeholder="John"
                {...register('first_name')} className={errors.first_name ? 'border-destructive' : ''} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-last">Last Name <span className="text-destructive">*</span></Label>
              <Input id="cu-last" placeholder="Doe"
                {...register('last_name')} className={errors.last_name ? 'border-destructive' : ''} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Password (admin only) */}
          {showPassword && (
            <div className="space-y-2">
              <Label htmlFor="cu-password">Password <span className="text-destructive">*</span></Label>
              <Input id="cu-password" type="password" placeholder="Min 8 characters"
                {...register('password')} className={errors.password ? 'border-destructive' : ''} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>
          )}

          {/* Organization (admin only — searchable by name, hidden when master org selected) */}
          {showOrganization && !isSelectedOrgMaster && (
            <OrgSearchField
              options={organizationOptions}
              loading={organizationsLoading}
              value={watch('organization_id') ?? ''}
              onChange={(id) => setValue('organization_id', id, { shouldValidate: true })}
              onSearch={onOrganizationSearch}
              error={errors.organization_id?.message}
            />
          )}

          {/* User Type + Organization grouped section */}
          {(showUserType || (showOrganization && isSelectedOrgMaster)) && (
            <div className="grid grid-cols-2 gap-4">
              {showUserType && (
                <div className="space-y-2">
                  <Label>User Type</Label>
                  {isSelectedOrgMaster ? (
                    <>
                      <Input value="System Admin" disabled className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">Master organization users are System Admin</p>
                    </>
                  ) : (
                    <Select value={watch('user_type') ?? ''} onValueChange={(v) => setValue('user_type', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {filteredUserTypeOptions.filter(opt => opt.value !== 'system_admin').map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              {showOrganization && isSelectedOrgMaster && (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <div className="flex gap-2">
                    <Input
                      value={masterOrganizationName}
                      disabled
                      className="bg-muted/50 flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" className="shrink-0"
                      onClick={() => { setValue('organization_id', ''); setValue('user_type', ''); setValue('system_admin_role_ids', []); }}>
                      Change
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">System admins are assigned to the master organization</p>
                </div>
              )}
            </div>
          )}

          {/* Phone (separate row when user type is shown above) */}
          {showPhone && (
            <div className="space-y-2">
              <Label htmlFor="cu-phone">Phone</Label>
              <Input id="cu-phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
            </div>
          )}

          {/* Role select (org invite flow) */}
          {showRoleSelect && (
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select onValueChange={(v) => setValue('role_id', v)} value={watch('role_id') ?? ''} disabled={rolesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={rolesLoading ? 'Loading roles...' : 'Choose a role'} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && <span className="text-muted-foreground ml-2">({role.description})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Select primary role for this user</p>
            </div>
          )}

          {/* Roles checkboxes (admin flow) — hidden when master org is selected, no system_admin option */}
          {showRoles && !isSelectedOrgMaster && !isSystemAdmin && (
            <div className="space-y-3">
              <Label>Roles</Label>
              <p className="text-xs text-muted-foreground">Select the role for this user within the organization</p>
              <div className="space-y-3">
                {filteredRoleCheckboxOptions.filter(r => r.value !== 'system_admin').map((role) => {
                  const isSelected = currentRoles.includes(role.value);
                  return (
                    <div key={role.value}
                      className={`rounded-lg border p-4 cursor-pointer transition-colors ${isSelected ? 'border-[#3058EE] bg-[#3058EE]/5' : 'border-border hover:border-muted-foreground/30'}`}
                      onClick={() => handleRoleToggle(role.value, !isSelected)}>
                      <div className="flex items-start gap-3">
                        <Checkbox id={`cu-role-${role.value}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()} />
                        <div className="flex-1">
                          <label htmlFor={`cu-role-${role.value}`}
                            className="text-sm font-medium leading-none cursor-pointer">{role.label}</label>
                          {'description' in role && role.description && (
                            <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Admin Role Selection — shown when master org is selected */}
          {(isSelectedOrgMaster || currentUserType === 'system_admin') && systemAdminRoles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label>System Admin Roles</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more roles to assign to this system admin user. Permissions are defined per role.
              </p>
              {systemAdminRolesLoading ? (
                <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                  Loading roles...
                </div>
              ) : (
                <div className="space-y-3">
                  {systemAdminRoles.map((role) => {
                    const isSelected = currentSystemAdminRoleIds.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#3058EE] bg-[#3058EE]/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                        onClick={() => handleSystemAdminRoleToggle(role.id, !isSelected)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`cu-sa-role-${role.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSystemAdminRoleToggle(role.id, !!checked)}
                            className="mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-2">
                            <div>
                              <label
                                htmlFor={`cu-sa-role-${role.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {role.name}
                              </label>
                              {role.description && (
                                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                              )}
                            </div>
                            {isSelected && role.permissions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {role.permissions.map((perm) => (
                                  <Badge key={perm.id} variant="secondary" className="text-xs font-normal">
                                    {perm.name || perm.code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Message (org invite flow) */}
          {showMessage && (
            <div className="space-y-2">
              <Label htmlFor="cu-message">Personal Message (optional)</Label>
              <textarea id="cu-message" rows={3} placeholder="Add a welcome message..."
                {...register('message')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
              {isSubmitting ? 'Submitting...' : (
                <><SubmitIcon className="mr-2 h-4 w-4" />{submitLabel}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
