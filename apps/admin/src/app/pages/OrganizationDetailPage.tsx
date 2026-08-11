import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
  Users,
  Pencil,
  X,
} from 'lucide-react';
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
import { useCurrencyStore } from '@horizon-sync/store';
import { getCurrencySymbol } from '@horizon-sync/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
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

import { OrganizationCreditsCard } from '../components/OrganizationCreditsCard';
import { useOrganization, useUpdateOrganization } from '../hooks/useOrganization';
import type { AdminOrgDetailResponse, OrgStatus } from '../types';

const orgEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal('')),
  organization_type: z.enum(['enterprise', 'business', 'startup', 'individual']).optional(),
  industry: z.string().nullable().optional(),
  base_currency: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
  country: z.string().nullable().optional(),
});

type OrgEditFormValues = z.infer<typeof orgEditSchema>;

function statusVariant(status: OrgStatus) {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    case 'trial':
      return 'outline';
  }
}

function dash(value: string | null | undefined): string {
  return value ?? '—';
}

function SummaryCards({ org, loading }: { org?: AdminOrgDetailResponse; loading: boolean }) {
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'INR');
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{org?.user_count ?? 0}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{org?.invoice_count ?? 0}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Total</CardTitle>
          <span className="h-4 w-4 inline-flex items-center justify-center text-sm font-bold mr-2">{currencySymbol}</span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {org?.payment_total != null ? parseFloat(org.payment_total).toLocaleString() : '0'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrgFields({ org }: { org: AdminOrgDetailResponse }) {
  const fields: { label: string; value: string }[] = [
    { label: 'Name', value: org.name },
    { label: 'Slug', value: org.slug },
    { label: 'Display Name', value: dash(org.display_name) },
    { label: 'Description', value: dash(org.description) },
    { label: 'Email', value: dash(org.email) },
    { label: 'Phone', value: dash(org.phone) },
    { label: 'Website', value: dash(org.website) },
    { label: 'Organization Type', value: org.organization_type },
    { label: 'Industry', value: dash(org.industry) },
    { label: 'Base Currency', value: dash(org.base_currency) },
    { label: 'Country', value: dash(org.country) },
    { label: 'Active', value: org.is_active ? 'Yes' : 'No' },
    { label: 'Created At', value: org.created_at },
    { label: 'Updated At', value: dash(org.updated_at) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Details
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
              <Badge variant={statusVariant(org.status)}>{org.status}</Badge>
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
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
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

// This legacy form coordinates validation, mutation errors, and suspension confirmation.
// eslint-disable-next-line complexity
function EditForm({
  org,
  onCancel,
  onSuccess,
}: {
  org: AdminOrgDetailResponse;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateOrganization();
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [pendingData, setPendingData] = useState<OrgEditFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<OrgEditFormValues>({
    resolver: zodResolver(orgEditSchema),
    defaultValues: {
      name: org.name,
      display_name: org.display_name ?? '',
      description: org.description ?? '',
      email: org.email ?? '',
      phone: org.phone ?? '',
      website: org.website ?? '',
      organization_type: org.organization_type,
      industry: org.industry ?? '',
      base_currency: org.base_currency ?? '',
      status: org.status,
      country: org.country ?? '',
    },
  });

  const currentStatus = watch('status');

  const submitUpdate = (values: OrgEditFormValues) => {
    const payload = {
      ...values,
      display_name: values.display_name || null,
      description: values.description || null,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      industry: values.industry || null,
      country: values.country || null,
      base_currency: values.base_currency || undefined,
    };

    updateMutation.mutate(
      { id: org.id, data: payload },
      {
        onSuccess: () => {
          toast({ title: 'Organization updated', description: 'Changes saved successfully.' });
          onSuccess();
        },
        onError: (error: unknown) => {
          const err = error as Error & { status?: number; data?: { detail?: string | { field: string; message: string }[] } };
          if (err.status === 409) {
            setError('name', { message: 'Organization with this slug already exists' });
          } else if (err.status === 422 && Array.isArray(err.data?.detail)) {
            for (const fieldErr of err.data.detail) {
              const fieldName = fieldErr.field as keyof OrgEditFormValues;
              if (fieldName in orgEditSchema.shape) {
                setError(fieldName, { message: fieldErr.message });
              }
            }
          } else if (err.status === 404) {
            toast({ variant: 'destructive', title: 'Error', description: 'Organization not found' });
          } else {
            toast({ variant: 'destructive', title: 'Error', description: err.data?.detail as string ?? 'Failed to update organization' });
          }
        },
      }
    );
  };

  const onSubmit = (values: OrgEditFormValues) => {
    if (values.status === 'suspended' && org.status !== 'suspended') {
      setPendingData(values);
      setShowSuspendDialog(true);
      return;
    }
    submitUpdate(values);
  };

  const confirmSuspend = () => {
    setShowSuspendDialog(false);
    if (pendingData) {
      submitUpdate(pendingData);
      setPendingData(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Organization
            </span>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Slug - read only */}
              <div>
                <Label>Slug</Label>
                <Input value={org.slug} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed</p>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>

              {/* Display Name */}
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input id="display_name" {...register('display_name')} />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} />
                {errors.website && <p className="text-xs text-destructive mt-1">{errors.website.message}</p>}
              </div>

              {/* Organization Type */}
              <div>
                <Label>Organization Type</Label>
                <Select value={currentStatus ? watch('organization_type') : undefined} onValueChange={(v) => setValue('organization_type', v as OrgEditFormValues['organization_type'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" {...register('industry')} />
              </div>

              {/* Base Currency */}
              <div>
                <Label htmlFor="base_currency">Base Currency</Label>
                <Input id="base_currency" {...register('base_currency')} />
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('country')} />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select value={currentStatus} onValueChange={(v) => setValue('status', v as OrgEditFormValues['status'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description - full width */}
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description')} />
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

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              Suspending this organization will cascade deactivation to all its users.
              This action can be reversed by changing the status back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowSuspendDialog(false); setPendingData(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSuspend}>
              Confirm Suspension
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// This page retains the existing loading, error, view, and edit branches.
// eslint-disable-next-line complexity
export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data: org, isLoading, isError, error } = useOrganization(id ?? '');

  const is404 =
    isError && (error as Error & { status?: number })?.status === 404;

  if (is404) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Building2 className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Organization not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/organizations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-48" /> : org?.name}</h1>
          {org && <Badge variant={statusVariant(org.status)}>{org.status}</Badge>}
        </div>
        {!editing && !isLoading && org && (
          <Button onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : org ? (
        <>
          <SummaryCards org={org} loading={false} />
          <OrganizationCreditsCard organizationId={org.id} />
          {editing ? (
            <EditForm org={org}
              onCancel={() => setEditing(false)}
              onSuccess={() => setEditing(false)}/>
          ) : (
            <OrgFields org={org} />
          )}
        </>
      ) : null}
    </div>
  );
}
