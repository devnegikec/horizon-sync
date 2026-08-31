import * as React from 'react';

import { Upload, Image, Link, Clock, MoreHorizontal, Info, Trash2, Package } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { DetailDialog } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

import { useBrands } from '../../features/qr-management/hooks/useBrands';
import { useQRProductSettings } from '../../hooks/useQRProductSettings';
import type { QRProductSetting } from '../../types/qr-product-settings.types';
import type { CreateQSealProductPayload, QSealProduct, QSealProductImageChanges } from '../../types/qseal.types';

interface FormValues {
  brand_id: string;
  name: string;
  sku: string;
  gtin: string;
  industry: string;
  unit_name: string;
  conversion_factor: string;
  length_mm: string;
  width_mm: string;
  height_mm: string;
  weight_grams: string;
  landing_page: string;
  client_product_auth_url: string;
  activation_method: string;
  sr_number_type: string;
  serial_prefix_setting_id: string;
  shelf_life_setting_id: string;
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
  { value: 'R8DAN', label: 'Random-8 Digit Alpha Numeric' },
  { value: 'R6DAN', label: 'Random-6 Digit Alpha Numeric' },
  { value: 'R4DAN', label: 'Random-4 Digit Alpha Numeric' },
  { value: 'S8DN', label: 'Serialized-8 Digit Max' },
  { value: 'S10DN', label: 'Serialized-10 Digit Max' },
];

const DEFAULT_VALUES: FormValues = {
  brand_id: '',
  name: '',
  sku: '',
  gtin: '',
  industry: '',
  unit_name: 'Each',
  conversion_factor: '1',
  length_mm: '',
  width_mm: '',
  height_mm: '',
  weight_grams: '',
  landing_page: '',
  client_product_auth_url: '',
  activation_method: 'pre',
  sr_number_type: 'R6DAN',
  serial_prefix_setting_id: '',
  shelf_life_setting_id: '',
  email: '',
  phone_number: '',
  redirect_to_client: false,
  image_url: '',
  banner_image_url: '',
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
  disabled?: boolean;
}

function BrandSelectSection({ brandId, onBrandChange, disabled = false }: BrandSelectSectionProps) {
  const { data, loading } = useBrands();
  const brands = data?.brands ?? [];

  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Brand" />
      <div className="space-y-1">
        <LabelWithTooltip label="Brand"
          required
          hint="Select the brand this product belongs to. The brand's ECDSA key pair will be used to sign QR codes."/>
        <Select value={brandId} onValueChange={onBrandChange} disabled={loading || disabled}>
          <SelectTrigger aria-label="Brand">
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
  error?: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function ImageDropZone({ label, required, hint, sizeHint, value, error, onFileSelect, onRemove }: ImageDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    onFileSelect(file);
    if (inputRef.current) inputRef.current.value = '';
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
              <p className="max-w-[250px] text-xs">
                {hint}
                {sizeHint ? ` ${sizeHint}` : ''}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {value ? (
        <div className="rounded-lg border overflow-hidden bg-muted/30">
          <img src={value} alt={label} className="w-full h-32 object-contain" />
          <div className="flex justify-end gap-2 border-t bg-background/90 p-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Replace
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors ${error ? 'border-destructive' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}>
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">Drag &amp; drop {label.toLowerCase()} here or</span>
          <Button type="button" variant="default" size="sm">
            Choose File
          </Button>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
      )}
      <input ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}/>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Product Images ───────────────────────────────────────────────────────────

interface ProductImagesSectionProps {
  imageUrl: string;
  bannerImageUrl: string;
  onImageSelect: (file: File) => void;
  onBannerSelect: (file: File) => void;
  onImageRemove: () => void;
  onBannerRemove: () => void;
  logoError?: string;
  bannerError?: string;
}

function ProductImagesSection({
  imageUrl,
  bannerImageUrl,
  onImageSelect,
  onBannerSelect,
  onImageRemove,
  onBannerRemove,
  logoError,
  bannerError,
}: ProductImagesSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Image} title="Product Images" />
      <div className="grid grid-cols-2 gap-4">
        <ImageDropZone label="Logo"
          hint="The logo will be displayed on authentication pages and certificates"
          sizeHint="Recommended size: 300x300px (PNG, JPG, WebP)"
          value={imageUrl}
          error={logoError}
          onFileSelect={onImageSelect}
          onRemove={onImageRemove}/>
        <ImageDropZone label="Banner Image"
          hint="The banner image will be displayed above product content"
          sizeHint="Recommended size: 1200x400px (PNG, JPG, WebP)"
          value={bannerImageUrl}
          error={bannerError}
          onFileSelect={onBannerSelect}
          onRemove={onBannerRemove}/>
      </div>
    </div>
  );
}

// ─── Product Info ─────────────────────────────────────────────────────────────

interface ProductInfoSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  control: ReturnType<typeof useForm<FormValues>>['control'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  shelfLifeSettings: QRProductSetting[];
  shelfLifeLoading: boolean;
  shelfLifeError: string | null;
}

function ProductInfoSection({ register, control, errors, shelfLifeSettings, shelfLifeLoading, shelfLifeError }: ProductInfoSectionProps) {
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
          <LabelWithTooltip htmlFor="gtin" label="GTIN" required hint="Global Trade Item Number (UPC, EAN, ISBN, etc.) - 12-14 digits" />
          <Input id="gtin" placeholder="e.g. 012345678901" {...register('gtin', { required: 'GTIN is required' })} />
          {errors.gtin && <p className="text-xs text-destructive">{errors.gtin.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="sku" label="SKU" hint="Stock Keeping Unit — a unique identifier for this product variant" />
          <Input id="sku" placeholder="e.g. PROD-001-BLK" {...register('sku')} />
          {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="industry" label="Industry" hint="Industry or sector this product belongs to" />
          <Input id="industry" placeholder="e.g. Pharmaceuticals" {...register('industry')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="shelf_life_setting_id" label="Shelf Life" required hint="Select a Shelf Life value configured in Settings" />
          <Controller name="shelf_life_setting_id"
            control={control}
            rules={{ required: 'Shelf life is required' }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={shelfLifeLoading}>
                <SelectTrigger id="shelf_life_setting_id" aria-label="Shelf Life">
                  <SelectValue placeholder={shelfLifeLoading ? 'Loading shelf life values…' : 'Select shelf life'} />
                </SelectTrigger>
                <SelectContent>
                  {shelfLifeSettings.map((setting) => (
                    <SelectItem key={setting.id} value={setting.id}>
                      {setting.label}
                      {!setting.is_active ? ' (Inactive)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}/>
          {!shelfLifeLoading && !shelfLifeError && shelfLifeSettings.length === 0 && (
            <p className="text-xs text-muted-foreground">No active Shelf Life values are configured.</p>
          )}
          {shelfLifeError && <p className="text-xs text-destructive">{shelfLifeError}</p>}
          {errors.shelf_life_setting_id && <p className="text-xs text-destructive">{errors.shelf_life_setting_id.message}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Packaging Details ───────────────────────────────────────────────────────

interface PackagingDetailsSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}

function PackagingDetailsSection({ register, errors }: PackagingDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Package} title="Packaging Details" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="unit_name"
            label="Unit of Measure (UMO)"
            required
            hint="The unit in which the product is sold, e.g. Each, Box, Bottle"/>
          <Input id="unit_name" placeholder="e.g. Each" {...register('unit_name', { required: 'Unit of measure is required' })} />
          {errors.unit_name && <p className="text-xs text-destructive">{errors.unit_name.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="conversion_factor"
            label="Conversion Factor"
            required
            hint="Number of base units that make up this packaging unit (e.g. 12 for a case of 12 bottles)"/>
          <Input id="conversion_factor"
            type="number"
            min={0}
            placeholder="e.g. 1"
            {...register('conversion_factor', {
              required: 'Conversion factor is required',
              min: { value: 0, message: 'Must be greater than or equal to 0' },
            })}/>
          {errors.conversion_factor && <p className="text-xs text-destructive">{errors.conversion_factor.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="length_mm" label="Length (mm)" hint="Length of the product/package in millimeters" />
          <Input id="length_mm" type="number" min={0} placeholder="e.g. 100" {...register('length_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="width_mm" label="Width (mm)" hint="Width of the product/package in millimeters" />
          <Input id="width_mm" type="number" min={0} placeholder="e.g. 50" {...register('width_mm')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="height_mm" label="Height (mm)" hint="Height of the product/package in millimeters" />
          <Input id="height_mm" type="number" min={0} placeholder="e.g. 30" {...register('height_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="weight_grams" label="Weight (g)" hint="Net weight of the product in grams" />
          <Input id="weight_grams" type="number" min={0} placeholder="e.g. 250" {...register('weight_grams')} />
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
          <LabelWithTooltip htmlFor="landing_page"
            label="Landing Page"
            required
            hint="Main product page URL where customers can learn about this product"/>
          <Input id="landing_page" type="url" placeholder="https://..." {...register('landing_page', { required: 'Landing page is required' })} />
          {errors.landing_page && <p className="text-xs text-destructive">{errors.landing_page.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="client_product_auth_url"
            label="Product Auth URL"
            required
            hint="URL where customers will be sent after QR scan"/>
          <Input id="client_product_auth_url"
            type="url"
            placeholder="https://..."
            {...register('client_product_auth_url', { required: 'Product auth URL is required' })}/>
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
  serialPrefixSettingId: string;
  serialPrefixSettings: QRProductSetting[];
  serialPrefixLoading: boolean;
  serialPrefixError: string | null;
  serialPrefixValidationError?: string;
  onActivationChange: (v: string) => void;
  onSrNumberChange: (v: string) => void;
  onSerialPrefixChange: (v: string) => void;
}

function ActivationDetailsSection({
  activationMethod,
  srNumberType,
  serialPrefixSettingId,
  serialPrefixSettings,
  serialPrefixLoading,
  serialPrefixError,
  serialPrefixValidationError,
  onActivationChange,
  onSrNumberChange,
  onSerialPrefixChange,
}: ActivationDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Clock} title="Activation Details" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip label="Activation Method"
            required
            hint="Choose how customers will activate this product (pre-activated or post-activation)"/>
          <Select value={activationMethod} onValueChange={onActivationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <LabelWithTooltip label="Serial Number Type" required hint="Select the format of serial numbers for this product" />
          <Select value={srNumberType} onValueChange={onSrNumberChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SR_NUMBER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <LabelWithTooltip label="Serial Prefix" required hint="Select a Serial Prefix configured in Product Settings" />
          <Select value={serialPrefixSettingId} onValueChange={onSerialPrefixChange} disabled={serialPrefixLoading}>
            <SelectTrigger aria-label="Serial Prefix">
              <SelectValue placeholder={serialPrefixLoading ? 'Loading prefixes…' : 'Select a serial prefix'} />
            </SelectTrigger>
            <SelectContent>
              {serialPrefixSettings.map((setting) => (
                <SelectItem key={setting.id} value={setting.id}>
                  {setting.value} — {setting.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!serialPrefixLoading && !serialPrefixError && serialPrefixSettings.length === 0 && (
            <p className="text-xs text-muted-foreground">No active Serial Prefix values are configured.</p>
          )}
          {serialPrefixError && <p className="text-xs text-destructive">{serialPrefixError}</p>}
          {serialPrefixValidationError && <p className="text-xs text-destructive">{serialPrefixValidationError}</p>}
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
        <Label htmlFor="redirect_to_client" className="text-sm font-normal cursor-pointer">
          Redirect to Product URL after QR scan
        </Label>
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

function isPersistedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeSerialNumberType(value: string | null | undefined): string {
  const normalized = value?.toUpperCase();
  const legacyTypes: Record<string, string> = {
    RANDOM_8_ALPHA_NUMERIC: 'R8DAN',
    RANDOM_6_ALPHA_NUMERIC: 'R6DAN',
    RANDOM_4_ALPHA_NUMERIC: 'R4DAN',
    SEQUENTIAL: 'S8DN',
    SEQUENTIAL_8_DIGIT: 'S8DN',
    SEQUENTIAL_10_DIGIT: 'S10DN',
  };
  return legacyTypes[normalized ?? ''] ?? normalized ?? 'R6DAN';
}

function buildPayload(data: FormValues): CreateQSealProductPayload {
  const n = emptyToNull;
  return {
    name: data.name,
    sku: n(data.sku),
    packaging_details: {
      unit_name: data.unit_name,
      conversion_factor: Number(data.conversion_factor) || 0,
      length_mm: data.length_mm ? Number(data.length_mm) : null,
      width_mm: data.width_mm ? Number(data.width_mm) : null,
      height_mm: data.height_mm ? Number(data.height_mm) : null,
      weight_grams: data.weight_grams ? Number(data.weight_grams) : null,
    },
    brand_id: n(data.brand_id),
    gtin: n(data.gtin),
    industry: n(data.industry),
    landing_page: n(data.landing_page),
    client_product_auth_url: n(data.client_product_auth_url),
    activation_method: data.activation_method,
    sr_number_type: n(data.sr_number_type),
    serial_prefix_setting_id: data.serial_prefix_setting_id,
    shelf_life_setting_id: data.shelf_life_setting_id,
    email: n(data.email),
    phone_number: n(data.phone_number),
    redirect_to_client: data.redirect_to_client,
  };
}

function optionalString(value: string | null | undefined, fallback: string): string {
  return value ?? fallback;
}

function optionalNumber(value: number | null | undefined, fallback: string): string {
  return value != null ? String(value) : fallback;
}

function getInitialValues(product: QSealProduct): FormValues {
  const pd = product.packaging_details;
  return {
    brand_id: optionalString(product.brand_id, ''),
    name: product.name,
    sku: nullToEmpty(product.sku),
    gtin: nullToEmpty(product.gtin),
    industry: nullToEmpty(product.industry),
    unit_name: optionalString(pd?.unit_name, 'Each'),
    conversion_factor: optionalNumber(pd?.conversion_factor, '1'),
    length_mm: optionalNumber(pd?.length_mm, ''),
    width_mm: optionalNumber(pd?.width_mm, ''),
    height_mm: optionalNumber(pd?.height_mm, ''),
    weight_grams: optionalNumber(pd?.weight_grams, ''),
    landing_page: nullToEmpty(product.landing_page),
    client_product_auth_url: nullToEmpty(product.client_product_auth_url),
    activation_method: optionalString(product.activation_method, 'pre'),
    sr_number_type: normalizeSerialNumberType(product.sr_number_type),
    serial_prefix_setting_id: optionalString(product.serial_prefix_setting_id, ''),
    shelf_life_setting_id: optionalString(product.shelf_life_setting_id, ''),
    email: nullToEmpty(product.email),
    phone_number: nullToEmpty(product.phone_number),
    redirect_to_client: product.redirect_to_client,
    image_url: nullToEmpty(product.image_url),
    banner_image_url: nullToEmpty(product.banner_image_url),
  };
}

function getFormDefaultValues(product?: QSealProduct | null): FormValues {
  return product ? getInitialValues(product) : DEFAULT_VALUES;
}

function getDisplayedImageUrl(preview: string, persistedUrl: string, removed: boolean): string {
  if (removed) return '';
  if (preview) return preview;
  return isPersistedImageUrl(persistedUrl) ? persistedUrl : '';
}

const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function validateImageFile(file: File): string | undefined {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only PNG, JPG, or WebP images are allowed.';
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`;
  }
  return undefined;
}

function getRequiredImageError(file: File | null, removed: boolean, persistedUrl: string, label: string): string | undefined {
  const missing = !file && (removed || !isPersistedImageUrl(persistedUrl));
  return missing ? `${label} is required. Please upload an image.` : undefined;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface QSealProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: QSealProduct | null;
  onSave: (data: CreateQSealProductPayload, imageChanges: QSealProductImageChanges) => void | Promise<void>;
  saving?: boolean;
}

export function QSealProductDialog({ open, onOpenChange, product, onSave, saving }: QSealProductDialogProps) {
  const isEdit = !!product;
  const { settings, loading: shelfLifeLoading, error: shelfLifeError } = useQRProductSettings('shelf_life');
  const { settings: serialPrefixSettingsData, loading: serialPrefixLoading, error: serialPrefixError } = useQRProductSettings('serial_prefix');
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: getFormDefaultValues(product),
  });
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = React.useState(false);
  const [removeBanner, setRemoveBanner] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState('');
  const [bannerPreview, setBannerPreview] = React.useState('');
  const [logoError, setLogoError] = React.useState<string | undefined>(undefined);
  const [bannerError, setBannerError] = React.useState<string | undefined>(undefined);
  const [logoRequiredError, setLogoRequiredError] = React.useState<string | undefined>(undefined);
  const [bannerRequiredError, setBannerRequiredError] = React.useState<string | undefined>(undefined);

  const brandId = watch('brand_id');
  const activationMethod = watch('activation_method');
  const srNumberType = watch('sr_number_type');
  const serialPrefixSettingId = watch('serial_prefix_setting_id');
  const redirectToClient = watch('redirect_to_client');
  const imageUrl = watch('image_url');
  const bannerImageUrl = watch('banner_image_url');
  const currentShelfLifeSettingId = watch('shelf_life_setting_id');
  const shelfLifeSettings = React.useMemo(
    () => settings.filter((setting) => setting.is_active || setting.id === currentShelfLifeSettingId),
    [settings, currentShelfLifeSettingId],
  );
  const serialPrefixSettings = React.useMemo(
    () => serialPrefixSettingsData.filter((setting) => setting.is_active || setting.id === serialPrefixSettingId),
    [serialPrefixSettingsData, serialPrefixSettingId],
  );

  React.useEffect(() => {
    if (open) {
      reset(product ? getInitialValues(product) : DEFAULT_VALUES);
      setLogoFile(null);
      setBannerFile(null);
      setRemoveLogo(false);
      setRemoveBanner(false);
      setLogoPreview('');
      setBannerPreview('');
      setLogoError(undefined);
      setBannerError(undefined);
      setLogoRequiredError(undefined);
      setBannerRequiredError(undefined);
    }
  }, [open, product, reset]);

  React.useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  React.useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const handleLogoSelect = (file: File) => {
    const fileError = validateImageFile(file);
    if (fileError) {
      setLogoError(fileError);
      return;
    }
    setLogoError(undefined);
    setLogoRequiredError(undefined);
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBannerSelect = (file: File) => {
    const fileError = validateImageFile(file);
    if (fileError) {
      setBannerError(fileError);
      return;
    }
    setBannerError(undefined);
    setBannerRequiredError(undefined);
    setBannerFile(file);
    setRemoveBanner(false);
    setBannerPreview(URL.createObjectURL(file));
  };

  const submitValidForm = handleSubmit((data: FormValues) => {
    return onSave(buildPayload(data), {
      logoFile,
      bannerFile,
      removeLogo,
      removeBanner,
    });
  });

  const handleSubmitForm = (event: React.FormEvent) => {
    event.preventDefault();

    if (logoError || bannerError) return;

    if (!isEdit) {
      const logoRequired = getRequiredImageError(logoFile, removeLogo, imageUrl, 'Logo');
      const bannerRequired = getRequiredImageError(bannerFile, removeBanner, bannerImageUrl, 'Banner image');

      setLogoRequiredError(logoRequired);
      setBannerRequiredError(bannerRequired);

      if (logoRequired || bannerRequired) return;
    }

    return submitValidForm(event);
  };

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit QSeal Product' : 'Create New Product'}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
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
      }>
      <form id="qseal-product-form" onSubmit={handleSubmitForm} noValidate>
        <BrandSelectSection brandId={brandId} onBrandChange={(v) => setValue('brand_id', v)} disabled={isEdit} />
        <Separator />
        <ProductImagesSection imageUrl={getDisplayedImageUrl(logoPreview, imageUrl, removeLogo)}
          bannerImageUrl={getDisplayedImageUrl(bannerPreview, bannerImageUrl, removeBanner)}
          onImageSelect={handleLogoSelect}
          onBannerSelect={handleBannerSelect}
          logoError={logoError ?? logoRequiredError}
          bannerError={bannerError ?? bannerRequiredError}
          onImageRemove={() => {
            setLogoFile(null);
            setLogoPreview('');
            setRemoveLogo(true);
            setLogoError(undefined);
          }}
          onBannerRemove={() => {
            setBannerFile(null);
            setBannerPreview('');
            setRemoveBanner(true);
            setBannerError(undefined);
          }}/>
        <Separator />
        <ProductInfoSection register={register}
          control={control}
          errors={errors}
          shelfLifeSettings={shelfLifeSettings}
          shelfLifeLoading={shelfLifeLoading}
          shelfLifeError={shelfLifeError}/>
        <Separator />
        <PackagingDetailsSection register={register} errors={errors} />
        <Separator />
        <ProductUrlsSection register={register} errors={errors} />
        <Separator />
        <input type="hidden" {...register('serial_prefix_setting_id', { required: 'Serial prefix is required' })} />
        <ActivationDetailsSection activationMethod={activationMethod}
          srNumberType={srNumberType}
          serialPrefixSettingId={serialPrefixSettingId}
          serialPrefixSettings={serialPrefixSettings}
          serialPrefixLoading={serialPrefixLoading}
          serialPrefixError={serialPrefixError}
          serialPrefixValidationError={errors.serial_prefix_setting_id?.message}
          onActivationChange={(v) => setValue('activation_method', v)}
          onSrNumberChange={(v) => setValue('sr_number_type', v)}
          onSerialPrefixChange={(v) => setValue('serial_prefix_setting_id', v, { shouldValidate: true })}/>
        <Separator />
        <AdditionalDetailsSection register={register}
          redirectToClient={redirectToClient}
          onRedirectChange={(checked) => setValue('redirect_to_client', checked)}/>
      </form>
    </DetailDialog>
  );
}
