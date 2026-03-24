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
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useCreateOrganization } from '../hooks/useCreateOrganization';

const orgCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
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

type OrgCreateFormValues = z.infer<typeof orgCreateSchema>;

export function CreateOrganizationPage() {
  const navigate = useNavigate();
  const createMutation = useCreateOrganization();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<OrgCreateFormValues>({
    resolver: zodResolver(orgCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      display_name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      base_currency: '',
      country: '',
    },
  });

  const onSubmit = (values: OrgCreateFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug,
      display_name: values.display_name || null,
      description: values.description || null,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      organization_type: values.organization_type,
      industry: values.industry || null,
      base_currency: values.base_currency || undefined,
      status: values.status,
      country: values.country || null,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast({
          title: 'Organization created',
          description: `${data.name} has been created successfully.`,
        });
        navigate(`/organizations/${data.id}`);
      },
      onError: (error: unknown) => {
        const err = error as Error & {
          status?: number;
          data?: { detail?: string | { field: string; message: string }[] };
        };
        if (err.status === 409) {
          setError('slug', {
            message: 'Organization with this slug already exists',
          });
        } else if (err.status === 422 && Array.isArray(err.data?.detail)) {
          for (const fieldErr of err.data.detail) {
            const fieldName = fieldErr.field as keyof OrgCreateFormValues;
            if (fieldName in orgCreateSchema.shape) {
              setError(fieldName, { message: fieldErr.message });
            }
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description:
              (err.data?.detail as string) ?? 'Failed to create organization',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/organizations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Organization</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" {...register('slug')} />
                {errors.slug && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.slug.message}
                  </p>
                )}
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
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
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
                {errors.website && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.website.message}
                  </p>
                )}
              </div>

              {/* Organization Type */}
              <div>
                <Label>Organization Type</Label>
                <Select value={watch('organization_type') ?? ''} onValueChange={(v) => setValue('organization_type', v as OrgCreateFormValues['organization_type'])}>

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
                <Select value={watch('status') ?? ''} onValueChange={(v) => setValue('status', v as OrgCreateFormValues['status'])}>

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
                <Textarea id="description" {...register('description')} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/organizations')}>

                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? 'Creating...'
                  : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
