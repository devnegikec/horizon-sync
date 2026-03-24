import * as React from 'react';

import { Upload, Image, Link, Clock, MoreHorizontal, Info, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@horizon-sync/ui/components/ui/button';
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
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { CreateQSealProductPayload, QSealProduct } from '../../types/qseal.types';
import { FormDialog } from '../containers';

interface FormValues {
  name: string;
  generic_name: string;
  gtin: string;
  industry: string;
  landing_page: string;
  client_product_auth_url: string;
  activation_method: string;
  sr_number_type: string;
  warranty_period_months: string;
  email: string;
  phone_number: string;
  redirect_to_client: boolean;
  image_url: string;
  banner_image_url: string;
}

const ACTIVATION_OPTIONS = [
  { value: 'pre', label: 'Pre-Activated' },
  { value: 'post', label: 'Post-Activated' },
];

const SR_NUMBER_OPTIONS = [
  { value: 'random_6_alpha_numeric', label: 'Random-6 Digit Alpha Numeric' },
  { value: 'random_8_alpha_numeric', label: 'Random-8 Digit Alpha Numeric' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_VALUES: FormValues = {
  name: '',
  generic_name: '',
  gtin: '',
  industry: '',
  landing_page: '',
  client_product_auth_url: '',
  activation_method: 'pre',
  sr_number_type: 'random_6_alpha_numeric',
  warranty_period_months: '',
  email: '',
  phone_number: '',
  redirect_to_client: false,
  image_url: '',
  banner_image_url: '',
};

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Icon className="h-4 w-4" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

interface ImageDropZoneProps {
  label: string;
  required?: boolean;
  hint: string;
  sizeHint: string;
  value: string;
  onChange: (url: string) => void;
}

function ImageDropZone({ label, required, hint, sizeHint, value, onChange }: ImageDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    onChange(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {value ? (
        <div className="relative rounded-lg border overflow-hidden bg-muted/30">
          <img src={value} alt={label} className="w-full h-32 object-contain" />
          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-background/80" onClick={() => onChange('')}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={handleKeyDown}>
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">Drag & drop {label.toLowerCase()} here or</span>
          <Button type="button" variant="default" size="sm">Choose File</Button>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
      <FieldHint>{hint}</FieldHint>
    </div>
  );
}

interface ProductImagesSectionProps {
  imageUrl: string;
  bannerImageUrl: string;
  onImageChange: (url: string) => void;
  onBannerChange: (url: string) => void;
}

function ProductImagesSection({ imageUrl, bannerImageUrl, onImageChange, onBannerChange }: ProductImagesSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Image} title="Product Images" />
      <div className="grid grid-cols-2 gap-4">
        <ImageDropZone label="Logo" required hint="The logo will be displayed on authentication pages and certificates" sizeHint="Recommended size: 300x300px (PNG, JPG)" value={imageUrl} onChange={onImageChange} />
        <ImageDropZone label="Banner Image" hint="Optional banner image for product pages (displayed above content)" sizeHint="Recommended size: 1200x400px (PNG, JPG)" value={bannerImageUrl} onChange={onBannerChange} />
      </div>
    </div>
  );
}

interface ProductInfoSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}

function ProductInfoSection({ register, errors }: ProductInfoSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Product Information" />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
          <Input id="name" placeholder="Product name" {...register('name', { required: 'Product name is required' })} />
          <FieldHint>The official name of your product as it should appear to customers</FieldHint>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="generic_name">Generic Name</Label>
          <Input id="generic_name" placeholder="Generic name" {...register('generic_name')} />
          <FieldHint>Optional generic name or category for this product</FieldHint>
        </div>
        <div className="space-y-1">
          <Label htmlFor="gtin">GTIN <span className="text-destructive">*</span></Label>
          <Input id="gtin" placeholder="e.g. 012345678901" {...register('gtin', { required: 'GTIN is required' })} />
          <FieldHint>Global Trade Item Number (UPC, EAN, ISBN, etc.) - 12-14 digits</FieldHint>
          {errors.gtin && <p className="text-xs text-destructive">{errors.gtin.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" placeholder="e.g. Pharmaceuticals" {...register('industry')} />
          <FieldHint>Industry or sector this product belongs to</FieldHint>
        </div>
        <div className="space-y-1">
          <Label htmlFor="warranty_period_months">Shelf Life <span className="text-destructive">*</span></Label>
          <Input id="warranty_period_months" type="number" min="0" placeholder="e.g. 10" {...register('warranty_period_months', { required: 'Shelf life is required' })} />
          <FieldHint>Expected lifespan or warranty period for this product (months)</FieldHint>
          {errors.warranty_period_months && <p className="text-xs text-destructive">{errors.warranty_period_months.message}</p>}
        </div>
      </div>
    </div>
  );
}

interface ProductUrlsSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}

function ProductUrlsSection({ register, errors }: ProductUrlsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Link} title="Product URLs" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="landing_page">Landing Page <span className="text-destructive">*</span></Label>
          <Input id="landing_page" type="url" placeholder="https://..." {...register('landing_page', { required: 'Landing page is required' })} />
          <FieldHint>Main product page URL where customers can learn about this product</FieldHint>
          {errors.landing_page && <p className="text-xs text-destructive">{errors.landing_page.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="client_product_auth_url">Product Auth URL <span className="text-destructive">*</span></Label>
          <Input id="client_product_auth_url" type="url" placeholder="https://..." {...register('client_product_auth_url', { required: 'Product auth URL is required' })} />
          <FieldHint>URL where customers will be sent after QR scan</FieldHint>
          {errors.client_product_auth_url && <p className="text-xs text-destructive">{errors.client_product_auth_url.message}</p>}
        </div>
      </div>
    </div>
  );
}

interface ActivationDetailsSectionProps {
  activationMethod: string;
  srNumberType: string;
  onActivationChange: (v: string) => void;
  onSrNumberChange: (v: string) => void;
}

function ActivationDetailsSection({ activationMethod, srNumberType, onActivationChange, onSrNumberChange }: ActivationDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Clock} title="Activation Details" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Activation Method <span className="text-destructive">*</span></Label>
          <Select value={activationMethod} onValueChange={onActivationChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint>Choose how customers will activate this product (pre-activated or post-activation)</FieldHint>
        </div>
        <div className="space-y-1">
          <Label>Serial Number Type <span className="text-destructive">*</span></Label>
          <Select value={srNumberType} onValueChange={onSrNumberChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SR_NUMBER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint>Select the format of serial numbers for this product</FieldHint>
        </div>
      </div>
    </div>
  );
}

interface AdditionalDetailsSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  redirectToClient: boolean;
  onRedirectChange: (checked: boolean) => void;
}

function AdditionalDetailsSection({ register, redirectToClient, onRedirectChange }: AdditionalDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={MoreHorizontal} title="Additional Details" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="email">Contact Email</Label>
          <Input id="email" type="email" placeholder="support@example.com" {...register('email')} />
          <FieldHint>Customer support email for this product</FieldHint>
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone_number">Contact Phone</Label>
          <Input id="phone_number" type="tel" placeholder="+1 234 567 8900" {...register('phone_number')} />
          <FieldHint>Customer support phone number for this product</FieldHint>
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox id="redirect_to_client" checked={redirectToClient} onCheckedChange={(checked) => onRedirectChange(checked === true)} />
        <Label htmlFor="redirect_to_client" className="text-sm font-normal cursor-pointer">Redirect to Product URL after QR scan</Label>
      </div>
    </div>
  );
}

/** Convert empty strings to null for optional API fields */
function emptyToNull(val: string): string | null {
  return val ? val : null;
}

/** Convert nullable string to empty string for form fields */
function nullToEmpty(val: string | null | undefined): string {
  return val ?? '';
}

function buildPayload(data: FormValues): CreateQSealProductPayload {
  const n = emptyToNull;
  return {
    name: data.name,
    generic_name: n(data.generic_name),
    gtin: n(data.gtin),
    industry: n(data.industry),
    landing_page: n(data.landing_page),
    image_url: n(data.image_url),
    banner_image_url: n(data.banner_image_url),
    client_product_auth_url: n(data.client_product_auth_url),
    activation_method: data.activation_method,
    sr_number_type: n(data.sr_number_type),
    warranty_period_months: data.warranty_period_months ? Number(data.warranty_period_months) : null,
    email: n(data.email),
    phone_number: n(data.phone_number),
    redirect_to_client: data.redirect_to_client,
  };
}

function getInitialValues(product: QSealProduct): FormValues {
  const e = nullToEmpty;
  return {
    name: product.name,
    generic_name: e(product.generic_name),
    gtin: e(product.gtin),
    industry: e(product.industry),
    landing_page: e(product.landing_page),
    client_product_auth_url: e(product.client_product_auth_url),
    activation_method: product.activation_method || 'pre',
    sr_number_type: product.sr_number_type || 'random_6_alpha_numeric',
    warranty_period_months: product.warranty_period_months?.toString() ?? '',
    email: e(product.email),
    phone_number: e(product.phone_number),
    redirect_to_client: product.redirect_to_client ?? false,
    image_url: e(product.image_url),
    banner_image_url: e(product.banner_image_url),
  };
}

interface QSealProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: QSealProduct | null;
  onSave: (data: CreateQSealProductPayload) => void;
  saving?: boolean;
}

export function QSealProductDialog({ open, onOpenChange, product, onSave, saving }: QSealProductDialogProps) {
  const isEdit = !!product;
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES });

  const activationMethod = watch('activation_method');
  const srNumberType = watch('sr_number_type');
  const redirectToClient = watch('redirect_to_client');
  const imageUrl = watch('image_url');
  const bannerImageUrl = watch('banner_image_url');

  React.useEffect(() => {
    if (open) {
      reset(product ? getInitialValues(product) : DEFAULT_VALUES);
    }
  }, [open, product, reset]);

  const onSubmit = handleSubmit((data: FormValues) => onSave(buildPayload(data)));

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit QSeal Product' : 'Create New Product'} size="md" onSubmit={onSubmit} submitLabel={isEdit ? 'Save Changes' : 'Create Product'} saving={saving}>
      <ProductImagesSection imageUrl={imageUrl} bannerImageUrl={bannerImageUrl} onImageChange={(v) => setValue('image_url', v)} onBannerChange={(v) => setValue('banner_image_url', v)} />
      <Separator />
      <ProductInfoSection register={register} errors={errors} />
      <Separator />
      <ProductUrlsSection register={register} errors={errors} />
      <Separator />
      <ActivationDetailsSection activationMethod={activationMethod} srNumberType={srNumberType} onActivationChange={(v) => setValue('activation_method', v)} onSrNumberChange={(v) => setValue('sr_number_type', v)} />
      <Separator />
      <AdditionalDetailsSection register={register} redirectToClient={redirectToClient} onRedirectChange={(checked) => setValue('redirect_to_client', checked)} />
    </FormDialog>
  );
}
