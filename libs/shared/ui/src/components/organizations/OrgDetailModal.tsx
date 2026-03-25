import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2, Pencil, Save, X, Mail, Phone, Globe, MapPin, Factory,
  DollarSign, Users, Calendar, Clock,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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

export type OrgDetailStatus = 'active' | 'inactive' | 'suspended' | 'trial';

export interface OrgDetailData {
  id: string;
  name: string;
  slug: string;
  display_name?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  country?: string | null;
  organization_type: string;
  industry?: string | null;
  base_currency?: string | null;
  status: OrgDetailStatus;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
  user_count?: number;
}

export interface OrgDetailEditData {
  name: string;
  display_name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  organization_type?: string;
  industry?: string;
  base_currency?: string;
  country?: string;
  status?: string;
}

export interface OrgDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  org: OrgDetailData | null;
  loading?: boolean;
  onUpdate?: (orgId: string, data: OrgDetailEditData) => Promise<void>;
}

const ORG_TYPE_OPTIONS = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'business', label: 'Business' },
  { value: 'startup', label: 'Startup' },
  { value: 'individual', label: 'Individual' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'trial', label: 'Trial' },
] as const;

function getOrgStatusBadge(status: OrgDetailStatus): { variant: 'success' | 'secondary' | 'destructive' | 'outline'; label: string } {
  switch (status) {
    case 'active': return { variant: 'success', label: 'Active' };
    case 'inactive': return { variant: 'secondary', label: 'Inactive' };
    case 'suspended': return { variant: 'destructive', label: 'Suspended' };
    case 'trial': return { variant: 'outline', label: 'Trial' };
    default: return { variant: 'secondary', label: status };
  }
}

function getOrgTypeBadge(orgType: string): { variant: 'default' | 'secondary' | 'outline'; label: string } {
  switch (orgType) {
    case 'enterprise': return { variant: 'default', label: 'Enterprise' };
    case 'business': return { variant: 'secondary', label: 'Business' };
    case 'startup': return { variant: 'outline', label: 'Startup' };
    case 'individual': return { variant: 'outline', label: 'Individual' };
    default: return { variant: 'outline', label: orgType };
  }
}

function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

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

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  display_name: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  organization_type: z.string().optional(),
  industry: z.string().optional(),
  base_currency: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
});

function ViewMode({ org, onEdit }: { org: OrgDetailData; onEdit?: () => void }) {
  const statusBadge = getOrgStatusBadge(org.status);
  const typeBadge = getOrgTypeBadge(org.organization_type);

  return (
    <div className="space-y-4">
      {/* Org header */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-lg font-semibold">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">{org.name}</h3>
          <p className="text-sm text-muted-foreground">{org.slug}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
          </div>
        </div>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </div>

      <Separator />

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <InfoRow icon={Mail} label="Email" value={org.email} />
        <InfoRow icon={Phone} label="Phone" value={org.phone} />
        <InfoRow icon={Globe} label="Website" value={org.website} />
        <InfoRow icon={MapPin} label="Country" value={org.country} />
        <InfoRow icon={Factory} label="Industry" value={org.industry} />
        <InfoRow icon={DollarSign} label="Base Currency" value={org.base_currency} />
        <InfoRow icon={Users} label="Users" value={org.user_count != null ? String(org.user_count) : '—'} />
        {org.created_at && <InfoRow icon={Calendar} label="Created" value={formatShortDate(org.created_at)} />}
        {org.updated_at && <InfoRow icon={Clock} label="Updated" value={formatDateTime(org.updated_at)} />}
      </div>
    </div>
  );
}

function EditMode({ org, onSave, onCancel }: {
  org: OrgDetailData;
  onSave: (data: OrgDetailEditData) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrgDetailEditData>({
    resolver: zodResolver(editSchema) as any,
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
      country: org.country ?? '',
      status: org.status,
    },
  });

  const onSubmit = async (data: OrgDetailEditData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSave(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Slug (read-only) */}
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={org.slug} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
      </div>

      {/* Name + Display Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="od-name">Name <span className="text-destructive">*</span></Label>
          <Input id="od-name" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="od-display">Display Name</Label>
          <Input id="od-display" {...register('display_name')} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="od-desc">Description</Label>
        <Input id="od-desc" {...register('description')} />
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="od-email">Email</Label>
          <Input id="od-email" type="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="od-phone">Phone</Label>
          <Input id="od-phone" {...register('phone')} />
        </div>
      </div>

      {/* Website + Industry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="od-website">Website</Label>
          <Input id="od-website" {...register('website')} className={errors.website ? 'border-destructive' : ''} />
          {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="od-industry">Industry</Label>
          <Input id="od-industry" {...register('industry')} />
        </div>
      </div>

      {/* Org Type + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Organization Type</Label>
          <Select value={watch('organization_type') ?? ''} onValueChange={v => setValue('organization_type', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {ORG_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch('status') ?? ''} onValueChange={v => setValue('status', v)}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Base Currency + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="od-currency">Base Currency</Label>
          <Input id="od-currency" {...register('base_currency')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="od-country">Country</Label>
          <Input id="od-country" {...register('country')} />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{errorMessage}</div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}
          className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
          {isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function OrgDetailModal({ open, onOpenChange, org, loading, onUpdate }: OrgDetailModalProps) {
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => { if (!open) setEditing(false); }, [open]);

  const handleSave = async (data: OrgDetailEditData) => {
    if (!org || !onUpdate) return;
    await onUpdate(org.id, data);
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{editing ? 'Edit Organization' : 'Organization Details'}</DialogTitle>
              <DialogDescription>{editing ? 'Update organization information' : 'View organization profile and details'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-56" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          </div>
        ) : !org ? (
          <div className="py-8 text-center text-muted-foreground">Organization not found</div>
        ) : editing ? (
          <EditMode org={org} onSave={handleSave} onCancel={() => setEditing(false)} />
        ) : (
          <>
            <ViewMode org={org} onEdit={onUpdate ? () => setEditing(true) : undefined} />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
