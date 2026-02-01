import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Globe, Users, FileText, ImagePlus, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useAuth } from '../../hooks/useAuth';
import { useOnboardingStore } from '../../hooks/useOnboardingStore';
import { OrganizationService } from '../../services/organization.service';

const organizationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  companySize: z.string().min(1, 'Please select company size'),
  organizationDescription: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const industries = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Professional Services',
  'Real Estate',
  'Media & Entertainment',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Government',
  'Non-profit',
  'Other',
];

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1000+ employees' },
];

export function OrganizationStep() {
  const { user, accessToken } = useAuth();
  const { data, updateData, setCurrentStep } = useOnboardingStore();
  const [logoPreview, setLogoPreview] = React.useState<string>(data.logoUrl || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: data.organizationName,
      industry: data.industry,
      companySize: data.companySize,
      organizationDescription: data.organizationDescription,
      websiteUrl: data.websiteUrl,
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        updateData({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData: OrganizationFormData) => {
    try {
      if (accessToken) {
        // Simple slug generation
        const slug = formData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        await OrganizationService.createOrganization(
          {
            name: formData.organizationName,
            display_name: formData.organizationName,
            slug: slug || `org-${Math.random().toString(36).substring(2, 11)}`,
            description: formData.organizationDescription || '',
            website: formData.websiteUrl || '',
            industry: formData.industry,
            organization_type: 'business',
            status: 'trial',
            email: user?.email || '',
            phone: user?.phone || '',
            extra_data: {
              company_size: formData.companySize,
              logo_url: logoPreview,
            },
            settings: {},
          },
          accessToken,
        );
      }

      updateData({
        ...formData,
        logoUrl: logoPreview,
      });
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-4 pb-4">
        <label
          htmlFor="logo-upload"
          className="group relative flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Organization logo" className="h-full w-full object-contain rounded-xl p-2" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Upload Logo</span>
            </div>
          )}
          <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
        </label>
        <p className="text-sm text-muted-foreground">Add your organization logo</p>
      </div>

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="organizationName">
          Organization Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="organizationName"
            placeholder="Acme Inc."
            {...register('organizationName')}
            className={`pl-10 ${errors.organizationName ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName.message}</p>}
      </div>

      {/* Industry & Company Size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <Select defaultValue={data.industry} onValueChange={(value) => setValue('industry', value)}>
            <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companySize">
            Company Size <span className="text-destructive">*</span>
          </Label>
          <Select defaultValue={data.companySize} onValueChange={(value) => setValue('companySize', value)}>
            <SelectTrigger className={errors.companySize ? 'border-destructive' : ''}>
              <Users className="h-4 w-4 text-muted-foreground mr-2" />
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {companySizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && <p className="text-sm text-destructive">{errors.companySize.message}</p>}
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="websiteUrl" type="url" placeholder="https://www.example.com" {...register('websiteUrl')} className={`pl-10 ${errors.websiteUrl ? 'border-destructive' : ''}`} />
        </div>
        {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="organizationDescription">Organization Description</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="organizationDescription"
            placeholder="Tell us about your organization..."
            {...register('organizationDescription')}
            className="pl-10 min-h-[100px] resize-none"
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">{watch('organizationDescription')?.length || 0}/1000 characters</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Continue to Invitations'}
        </Button>
      </div>
    </form>
  );
}
