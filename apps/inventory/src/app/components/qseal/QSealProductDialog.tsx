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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components/ui/tooltip';

import { useBrands } from '../../features/qr-management/hooks/useBrands';
import type { CreateQSealProductPayload, QSealProduct } from '../../types/qseal.types';
import { DetailDialog } from '@horizon-sync/ui/components';

interface FormValues {
  brand_id: string;
  name: string;
  generic_name: string;
  sku: string;
  gtin: string;
  industry: string;
  qr_type: string;
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
  packaging_unit_name: string;
  packaging_conversion_factor: string;
  packaging_items_per_master_pack: string;
  packaging_length_mm: string;
  packaging_width_mm: string;
  packaging_height_mm: string;
  packaging_weight_grams: string;
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

const QR_TYPE_OPTIONS = [
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'secure_qr_runtime', label: 'Secure QR Runtime' },
  { value: 'static_qr', label: 'Static QR' },
];

const DEFAULT_VALUES: FormValues = {
  brand_id: '',
  name: '',
  generic_name: '',
  sku: '',
  gtin: '',
  industry: '',
  qr_type: '',
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
  packaging_unit_name: 'Each',
  packaging_conversion_factor: '1',
  packaging_items_per_master_pack: '',
  packaging_length_mm: '',
  packaging_width_mm: '',
  packaging_height_mm: '',
  packaging_weight_grams: '',
};

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Icon className="h-4 w-4" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function LabelWithTooltip({ htmlFor, label, required, hint }: { htmlFor?: string; label: string; required?: boolean; hint: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[250px] text-xs">{hint}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ─── Brand Select Section ────────────────────────────────────────────────────

interface BrandSelectSectionProps {
  brandId: string;
  onBrandChange: (id: string) => void;
}

function BrandSelectSection({ brandId, onBrandChange }: BrandSelectSectionProps) {
  const { data, loading } = useBrands();
  const brands = data?.brands ?? [];

  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Brand" />
      <div className="space-y-1">
        <LabelWithTooltip label="Brand" required hint="Select the brand this product belongs to. The brand's ECDSA key pair will be used to sign QR codes." />
        <Select value={brandId} onValueChange={onBrandChange} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Loading brands…' : 'Select a brand'} />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
                {b.short_code ? <span className="ml-1 text-muted-foreground text-xs">({b.short_code})</span> : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Image Drop Zone ─────────────────────────────────────────────────────────

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
    onChange(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[250px] text-xs">{hint}{sizeHint ? ` ${sizeHint}` : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
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
          <span className="text-sm text-muted-foreground">Drag &amp; drop {label.toLowerCase()} here or</span>
          <Button type="button" variant="default" size="sm">Choose File</Button>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ─── Product Images ───────────────────────────────────────────────────────────

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

// ─── Product Info ─────────────────────────────────────────────────────────────

interface ProductInfoSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  qrType: string;
  onQrTypeChange: (v: string) => void;
}

function ProductInfoSection({ register, errors, qrType, onQrTypeChange }: ProductInfoSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Product Information" />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="name" label="Product Name" required hint="The official name of your product as it should appear to customers" />
          <Input id="name" placeholder="Product name" {...register('name', { required: 'Product name is required' })} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <LabelWithTooltip htmlFor="generic_name" label="Generic Name" hint="Generic or scientific name of the product" />
          <Input id="generic_name" placeholder="e.g. Paracetamol" {...register('generic_name')} />
        </div>

        <div className="space-y-1">
          <LabelWithTooltip htmlFor="sku" label="SKU" hint="Optional SKU or internal product code" />
          <Input id="sku" placeholder="e.g. SKU-12345" {...register('sku')} />
        </div>

        <div className="space-y-1">
          <LabelWithTooltip htmlFor="gtin" label="GTIN" required hint="Global Trade Item Number (UPC, EAN, ISBN, etc.) - 12-14 digits" />
          <Input id="gtin" placeholder="e.g. 012345678901" {...register('gtin', { required: 'GTIN is required' })} />
          {errors.gtin && <p className="text-xs text-destructive">{errors.gtin.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="industry" label="Industry" hint="Industry or sector this product belongs to" />
          <Input id="industry" placeholder="e.g. Pharmaceuticals" {...register('industry')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip label="QR Type" hint="QR code generation type for this product" />
          <Select value={qrType} onValueChange={onQrTypeChange}>
            <SelectTrigger><SelectValue placeholder="Select QR type" /></SelectTrigger>
            <SelectContent>
              {QR_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="warranty_period_months" label="Shelf Life" required hint="Expected lifespan or warranty period for this product (months)" />
          <Input id="warranty_period_months" type="number" min="0" placeholder="e.g. 10" {...register('warranty_period_months', { required: 'Shelf life is required' })} />
          {errors.warranty_period_months && <p className="text-xs text-destructive">{errors.warranty_period_months.message}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Product URLs ─────────────────────────────────────────────────────────────

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
          <LabelWithTooltip htmlFor="landing_page" label="Landing Page" required hint="Main product page URL where customers can learn about this product" />
          <Input id="landing_page" type="url" placeholder="https://..." {...register('landing_page', { required: 'Landing page is required' })} />
          {errors.landing_page && <p className="text-xs text-destructive">{errors.landing_page.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="client_product_auth_url" label="Product Auth URL" required hint="URL where customers will be sent after QR scan" />
          <Input id="client_product_auth_url" type="url" placeholder="https://..." {...register('client_product_auth_url', { required: 'Product auth URL is required' })} />
          {errors.client_product_auth_url && <p className="text-xs text-destructive">{errors.client_product_auth_url.message}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Activation Details ───────────────────────────────────────────────────────

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
          <LabelWithTooltip label="Activation Method" required hint="Choose how customers will activate this product (pre-activated or post-activation)" />
          <Select value={activationMethod} onValueChange={onActivationChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <LabelWithTooltip label="Serial Number Type" required hint="Select the format of serial numbers for this product" />
          <Select value={srNumberType} onValueChange={onSrNumberChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SR_NUMBER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Additional Details ───────────────────────────────────────────────────────

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
          <LabelWithTooltip htmlFor="email" label="Contact Email" hint="Customer support email for this product" />
          <Input id="email" type="email" placeholder="support@example.com" {...register('email')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="phone_number" label="Contact Phone" hint="Customer support phone number for this product" />
          <Input id="phone_number" type="tel" placeholder="+1 234 567 8900" {...register('phone_number')} />
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox id="redirect_to_client" checked={redirectToClient} onCheckedChange={(checked) => onRedirectChange(checked === true)} />
        <Label htmlFor="redirect_to_client" className="text-sm font-normal cursor-pointer">Redirect to Product URL after QR scan</Label>
      </div>
    </div>
  );
}

// ─── Packaging Details ──────────────────────────────────────────────────────────

interface PackagingDetailsSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
}

function PackagingDetailsSection({ register }: PackagingDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Packaging Details" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_unit_name" label="Base Unit Name" hint="The base packaging unit (e.g. Each)" />
          <Input id="packaging_unit_name" placeholder="Each" {...register('packaging_unit_name')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_conversion_factor" label="Conversion Factor" hint="Base units per pack (must be ≥ 1)" />
          <Input id="packaging_conversion_factor" type="number" step="1" min="1" placeholder="1" {...register('packaging_conversion_factor')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_items_per_master_pack" label="Items per Master Pack" hint="Number of items grouped under one master pack" />
          <Input id="packaging_items_per_master_pack" type="number" step="1" min="1" placeholder="10" {...register('packaging_items_per_master_pack')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_length_mm" label="Length (mm)" hint="Physical length in millimetres" />
          <Input id="packaging_length_mm" type="number" step="0.1" min="0" placeholder="0" {...register('packaging_length_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_width_mm" label="Width (mm)" hint="Physical width in millimetres" />
          <Input id="packaging_width_mm" type="number" step="0.1" min="0" placeholder="0" {...register('packaging_width_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_height_mm" label="Height (mm)" hint="Physical height in millimetres" />
          <Input id="packaging_height_mm" type="number" step="0.1" min="0" placeholder="0" {...register('packaging_height_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="packaging_weight_grams" label="Weight (g)" hint="Physical weight in grams" />
          <Input id="packaging_weight_grams" type="number" step="0.1" min="0" placeholder="0" {...register('packaging_weight_grams')} />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyToNull(val: string): string | null {
  return val || null;
}

function nullToEmpty(val: string | null | undefined): string {
  return val ?? '';
}

function buildPayload(data: FormValues): CreateQSealProductPayload {
  const n = emptyToNull;
  const hasPackaging = !!(data.packaging_length_mm ||
    data.packaging_width_mm ||
    data.packaging_height_mm ||
    data.packaging_weight_grams ||
    data.packaging_conversion_factor !== '1' ||
    data.packaging_items_per_master_pack ||
    (data.packaging_unit_name && data.packaging_unit_name !== 'Each'));

  return {
    brand_id: n(data.brand_id),
    name: data.name,
    generic_name: n(data.generic_name),
    sku: n(data.sku),
    gtin: n(data.gtin),
    industry: n(data.industry),
    qr_type: n(data.qr_type),
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
    ...(hasPackaging
      ? {
        packaging_details: {
          unit_name: data.packaging_unit_name || 'Each',
          conversion_factor: Number(data.packaging_conversion_factor) || 1,
          items_per_master_pack: data.packaging_items_per_master_pack
            ? Number(data.packaging_items_per_master_pack)
            : null,
          length_mm: parseFloat(data.packaging_length_mm) || null,
          width_mm: parseFloat(data.packaging_width_mm) || null,
          height_mm: parseFloat(data.packaging_height_mm) || null,
          weight_grams: parseFloat(data.packaging_weight_grams) || null,
        },
      }
      : {}),
  };
}

function getInitialValues(product: QSealProduct): FormValues {
  const e = nullToEmpty;
  const pd = (product.extra_data as Record<string, unknown> | null | undefined)?.packaging_details as
    | Record<string, unknown>
    | undefined;
  return {
    brand_id: '',
    name: product.name,
    generic_name: e(product.generic_name),
    sku: e(product.sku ?? product.generic_name),
    gtin: e(product.gtin),
    industry: e(product.industry),
    qr_type: e(product.qr_type),
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
    packaging_unit_name: (pd?.unit_name as string) || 'Each',
    packaging_conversion_factor: pd?.conversion_factor != null
      ? String(pd.conversion_factor)
      : '1',
    packaging_items_per_master_pack: pd?.items_per_master_pack != null
      ? String(pd.items_per_master_pack)
      : '',
    packaging_length_mm: pd?.length_mm != null ? String(pd.length_mm) : '',
    packaging_width_mm: pd?.width_mm != null ? String(pd.width_mm) : '',
    packaging_height_mm: pd?.height_mm != null ? String(pd.height_mm) : '',
    packaging_weight_grams: pd?.weight_grams != null ? String(pd.weight_grams) : '',
  };
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

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

  const brandId = watch('brand_id');
  const activationMethod = watch('activation_method');
  const srNumberType = watch('sr_number_type');
  const redirectToClient = watch('redirect_to_client');
  const imageUrl = watch('image_url');
  const bannerImageUrl = watch('banner_image_url');
  const qrType = watch('qr_type');

  React.useEffect(() => {
    if (open) reset(product ? getInitialValues(product) : DEFAULT_VALUES);
  }, [open, product, reset]);

  const onSubmit = handleSubmit((data: FormValues) => onSave(buildPayload(data)));

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={isEdit ? 'Edit QSeal Product' : 'Create New Product'}
      showCloseButton={false}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="qseal-product-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      }
    >
      <form id="qseal-product-form" onSubmit={onSubmit} className="space-y-6">
        <BrandSelectSection brandId={brandId} onBrandChange={(v) => setValue('brand_id', v)} />
        <Separator />
        <ProductImagesSection imageUrl={imageUrl} bannerImageUrl={bannerImageUrl} onImageChange={(v) => setValue('image_url', v)} onBannerChange={(v) => setValue('banner_image_url', v)} />
        <Separator />
        <ProductInfoSection register={register} errors={errors} qrType={qrType} onQrTypeChange={(v) => setValue('qr_type', v)} />
        <Separator />
        <ProductUrlsSection register={register} errors={errors} />
        <Separator />
        <ActivationDetailsSection activationMethod={activationMethod} srNumberType={srNumberType} onActivationChange={(v) => setValue('activation_method', v)} onSrNumberChange={(v) => setValue('sr_number_type', v)} />
        <Separator />
        <AdditionalDetailsSection register={register} redirectToClient={redirectToClient} onRedirectChange={(checked) => setValue('redirect_to_client', checked)} />
        <Separator />
        <PackagingDetailsSection register={register} />
      </form>
    </DetailDialog>
  );
}
