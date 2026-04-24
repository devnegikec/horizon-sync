import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Users, Settings, DollarSign, Shield, Save, RefreshCw, ToggleLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { toast } from '@horizon-sync/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@horizon-sync/ui/components/ui/avatar';

import { SystemSettingsService, type SystemSettings, type SystemAdminUser } from '../services/system-settings.service';
import { usePermissions } from '../hooks/usePermissions';
import {
  useSystemSettings,
  useMasterOrganization,
  useSystemAdminUsers,
  useUpdateSystemSettings,
  useUpdateMasterOrganization,
} from '../hooks/useSystemSettings';
import { FeatureControlsPage } from '../pages/FeatureControlsPage';

const masterOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  display_name: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  industry: z.string().optional(),
  country: z.string().optional(),
});

const subscriptionConfigSchema = z.object({
  default_seat_limit: z.number().min(1, 'Must be at least 1').max(10000, 'Must be less than 10,000'),
  default_credit_limit: z.number().min(0, 'Must be non-negative').max(1000000, 'Must be reasonable'),
  base_price_per_seat: z.number().min(0, 'Must be non-negative').max(1000, 'Must be reasonable'),
  credit_rate: z.number().min(0, 'Must be non-negative').max(10, 'Must be reasonable'),
});

const systemConfigSchema = z.object({
  auto_deactivate_enabled: z.boolean(),
  auto_deactivate_days: z.number().min(30, 'Must be at least 30 days').max(365, 'Must be less than 365 days'),
  grace_period_days: z.number().min(7, 'Must be at least 7 days').max(90, 'Must be less than 90 days'),
  reminder_frequency_days: z.number().min(1, 'Must be at least 1 day').max(30, 'Must be less than 30 days'),
});

type MasterOrgFormData = z.infer<typeof masterOrgSchema>;
type SubscriptionConfigFormData = z.infer<typeof subscriptionConfigSchema>;
type SystemConfigFormData = z.infer<typeof systemConfigSchema>;

interface MasterOrgSetupProps {
  className?: string;
}

export function MasterOrgSetup({ className = '' }: MasterOrgSetupProps) {
  const [activeTab, setActiveTab] = useState<'organization' | 'subscription' | 'system' | 'users' | 'featureControls'>('organization');
  const { canModifySystemSettings } = usePermissions();

  // Use hooks for data fetching
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useSystemSettings();
  const { data: masterOrg, isLoading: masterOrgLoading } = useMasterOrganization();
  const { data: adminUsersData, isLoading: adminUsersLoading } = useSystemAdminUsers();

  // Use mutation hooks
  const updateSettingsMutation = useUpdateSystemSettings();
  const updateMasterOrgMutation = useUpdateMasterOrganization();

  // Form setup
  const orgForm = useForm<MasterOrgFormData>({
    resolver: zodResolver(masterOrgSchema),
  });

  const subscriptionForm = useForm<SubscriptionConfigFormData>({
    resolver: zodResolver(subscriptionConfigSchema),
  });

  const systemForm = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
  });

  // Populate forms when data loads
  useEffect(() => {
    if (masterOrg) {
      orgForm.reset({
        name: masterOrg.name,
        display_name: masterOrg.display_name || '',
        description: masterOrg.description || '',
        email: masterOrg.email || '',
        phone: masterOrg.phone || '',
        website: masterOrg.website || '',
        industry: masterOrg.industry || '',
        country: masterOrg.country || '',
      });
    }
  }, [masterOrg, orgForm]);

  useEffect(() => {
    if (settings) {
      subscriptionForm.reset(settings.subscription_config);
      systemForm.reset(settings.system_config);
    }
  }, [settings, subscriptionForm, systemForm]);

  const isLoading = settingsLoading || masterOrgLoading || adminUsersLoading;
  const isSaving = updateSettingsMutation.isPending || updateMasterOrgMutation.isPending;

  const handleSaveOrganization = async (data: MasterOrgFormData) => {
    if (!canModifySystemSettings) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify system settings',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateMasterOrgMutation.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Master organization updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update master organization',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSubscriptionConfig = async (data: SubscriptionConfigFormData) => {
    if (!canModifySystemSettings) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify system settings',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        subscription_config: data,
      });
      toast({
        title: 'Success',
        description: 'Subscription configuration updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription configuration',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSystemConfig = async (data: SystemConfigFormData) => {
    if (!canModifySystemSettings) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to modify system settings',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        system_config: data,
      });
      toast({
        title: 'Success',
        description: 'System configuration updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update system configuration',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canModifySystemSettings) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Access Restricted</h3>
              <p className="text-sm text-muted-foreground">
                You need system administrator master permissions to access system settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('organization')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'organization'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Building2 className="h-4 w-4 inline-block mr-2" />
          Organization
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'subscription'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <DollarSign className="h-4 w-4 inline-block mr-2" />
          Subscription
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'system'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Settings className="h-4 w-4 inline-block mr-2" />
          System
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Users className="h-4 w-4 inline-block mr-2" />
          Admin Users
        </button>
        <button
          onClick={() => setActiveTab('featureControls')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'featureControls'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <ToggleLeft className="h-4 w-4 inline-block mr-2" />
          Feature Controls
        </button>
      </div>

      {/* Organization Settings */}
      {activeTab === 'organization' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Master Organization Configuration
            </CardTitle>
            <CardDescription>
              Configure the master organization details and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={orgForm.handleSubmit(handleSaveOrganization)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...orgForm.register('name')}
                    placeholder="Enter organization name"
                    disabled={!canModifySystemSettings}
                  />
                  {orgForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{orgForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    {...orgForm.register('display_name')}
                    placeholder="Enter display name"
                    disabled={!canModifySystemSettings}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...orgForm.register('description')}
                    placeholder="Enter organization description"
                    disabled={!canModifySystemSettings}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...orgForm.register('email')}
                    placeholder="Enter email address"
                    disabled={!canModifySystemSettings}
                  />
                  {orgForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{orgForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...orgForm.register('phone')}
                    placeholder="Enter phone number"
                    disabled={!canModifySystemSettings}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...orgForm.register('website')}
                    placeholder="Enter website URL"
                    disabled={!canModifySystemSettings}
                  />
                  {orgForm.formState.errors.website && (
                    <p className="text-sm text-destructive">{orgForm.formState.errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    {...orgForm.register('industry')}
                    placeholder="Enter industry"
                    disabled={!canModifySystemSettings}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...orgForm.register('country')}
                    placeholder="Enter country"
                    disabled={!canModifySystemSettings}
                  />
                </div>
              </div>

              {canModifySystemSettings && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Organization
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Subscription Configuration */}
      {activeTab === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription & Pricing Configuration
            </CardTitle>
            <CardDescription>
              Configure default subscription limits and pricing for customer organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={subscriptionForm.handleSubmit(handleSaveSubscriptionConfig)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_seat_limit">Default Seat Limit</Label>
                  <Input
                    id="default_seat_limit"
                    type="number"
                    min="1"
                    max="10000"
                    {...subscriptionForm.register('default_seat_limit', { valueAsNumber: true })}
                    placeholder="Enter default seat limit"
                    disabled={!canModifySystemSettings}
                  />
                  {subscriptionForm.formState.errors.default_seat_limit && (
                    <p className="text-sm text-destructive">{subscriptionForm.formState.errors.default_seat_limit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_credit_limit">Default Credit Limit</Label>
                  <Input
                    id="default_credit_limit"
                    type="number"
                    min="0"
                    max="1000000"
                    {...subscriptionForm.register('default_credit_limit', { valueAsNumber: true })}
                    placeholder="Enter default credit limit"
                    disabled={!canModifySystemSettings}
                  />
                  {subscriptionForm.formState.errors.default_credit_limit && (
                    <p className="text-sm text-destructive">{subscriptionForm.formState.errors.default_credit_limit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_price_per_seat">Base Price Per Seat ($)</Label>
                  <Input
                    id="base_price_per_seat"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    {...subscriptionForm.register('base_price_per_seat', { valueAsNumber: true })}
                    placeholder="Enter base price per seat"
                    disabled={!canModifySystemSettings}
                  />
                  {subscriptionForm.formState.errors.base_price_per_seat && (
                    <p className="text-sm text-destructive">{subscriptionForm.formState.errors.base_price_per_seat.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_rate">Credit Rate ($)</Label>
                  <Input
                    id="credit_rate"
                    type="number"
                    step="0.001"
                    min="0"
                    max="10"
                    {...subscriptionForm.register('credit_rate', { valueAsNumber: true })}
                    placeholder="Enter credit rate"
                    disabled={!canModifySystemSettings}
                  />
                  {subscriptionForm.formState.errors.credit_rate && (
                    <p className="text-sm text-destructive">{subscriptionForm.formState.errors.credit_rate.message}</p>
                  )}
                </div>
              </div>

              {canModifySystemSettings && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Subscription Config
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* System Configuration */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Configure system-wide settings for billing automation and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={systemForm.handleSubmit(handleSaveSystemConfig)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto_deactivate_enabled">Auto-deactivation Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically deactivate organizations for non-payment
                    </p>
                  </div>
                  <Checkbox
                    id="auto_deactivate_enabled"
                    {...systemForm.register('auto_deactivate_enabled')}
                    disabled={!canModifySystemSettings}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto_deactivate_days">Auto-deactivation Days</Label>
                    <Input
                      id="auto_deactivate_days"
                      type="number"
                      min="30"
                      max="365"
                      {...systemForm.register('auto_deactivate_days', { valueAsNumber: true })}
                      placeholder="Days before deactivation"
                      disabled={!canModifySystemSettings}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days overdue before automatic deactivation
                    </p>
                    {systemForm.formState.errors.auto_deactivate_days && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.auto_deactivate_days.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace_period_days">Grace Period Days</Label>
                    <Input
                      id="grace_period_days"
                      type="number"
                      min="7"
                      max="90"
                      {...systemForm.register('grace_period_days', { valueAsNumber: true })}
                      placeholder="Grace period days"
                      disabled={!canModifySystemSettings}
                    />
                    <p className="text-xs text-muted-foreground">
                      Initial grace period before reminders
                    </p>
                    {systemForm.formState.errors.grace_period_days && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.grace_period_days.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder_frequency_days">Reminder Frequency</Label>
                    <Input
                      id="reminder_frequency_days"
                      type="number"
                      min="1"
                      max="30"
                      {...systemForm.register('reminder_frequency_days', { valueAsNumber: true })}
                      placeholder="Days between reminders"
                      disabled={!canModifySystemSettings}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days between reminder emails
                    </p>
                    {systemForm.formState.errors.reminder_frequency_days && (
                      <p className="text-sm text-destructive">{systemForm.formState.errors.reminder_frequency_days.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {canModifySystemSettings && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save System Config
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admin Users */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              System Administrator Users
            </CardTitle>
            <CardDescription>
              Manage users with system administrator privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!adminUsersData || adminUsersData.users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No system administrator users found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminUsersData.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {user.first_name.charAt(0).toUpperCase()}{user.last_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex gap-1 mt-1">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Controls */}
      {activeTab === 'featureControls' && (
        <div className="space-y-6">
          <FeatureControlsPage />
        </div>
      )}
    </div>
  );
}