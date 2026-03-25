import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
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

export type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOrgFormData) => Promise<void>;
}

export function CreateOrgModal({ open, onOpenChange, onSubmit }: CreateOrgModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema) as any,
    defaultValues: {
      name: '', slug: '', display_name: '', description: '',
      email: '', phone: '', website: '', organization_type: 'business',
      industry: '', base_currency: '', country: '', status: 'active',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleFormSubmit = async (data: CreateOrgFormData) => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create Organization</DialogTitle>
              <DialogDescription>Fill in the details to create a new organization</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-name">Name <span className="text-destructive">*</span></Label>
              <Input id="co-name" placeholder="Acme Corp" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-slug">Slug <span className="text-destructive">*</span></Label>
              <Input id="co-slug" placeholder="acme-corp" {...register('slug')} className={errors.slug ? 'border-destructive' : ''} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          {/* Display Name + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-display">Display Name</Label>
              <Input id="co-display" placeholder="Acme Corporation" {...register('display_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-desc">Description</Label>
              <Input id="co-desc" placeholder="Brief description" {...register('description')} />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-email">Email</Label>
              <Input id="co-email" type="email" placeholder="contact@acme.com" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone</Label>
              <Input id="co-phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
            </div>
          </div>

          {/* Website + Industry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-website">Website</Label>
              <Input id="co-website" placeholder="https://acme.com" {...register('website')} className={errors.website ? 'border-destructive' : ''} />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-industry">Industry</Label>
              <Input id="co-industry" placeholder="Technology" {...register('industry')} />
            </div>
          </div>

          {/* Org Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Type</Label>
              <Select value={watch('organization_type') ?? 'business'} onValueChange={v => setValue('organization_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch('status') ?? 'active'} onValueChange={v => setValue('status', v)}>
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
              <Label htmlFor="co-currency">Base Currency</Label>
              <Input id="co-currency" placeholder="USD" {...register('base_currency')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-country">Country</Label>
              <Input id="co-country" placeholder="United States" {...register('country')} />
            </div>
          </div>

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
              {isSubmitting ? 'Creating...' : <><Plus className="mr-2 h-4 w-4" />Create Organization</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
