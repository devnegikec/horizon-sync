import * as React from 'react';

import { Upload, Image, Link, Clock, MoreHorizontal, Info, Trash2, Package, QrCode, Tag, Pencil } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { DetailDialog, Badge } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
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
  items_per_ic_pack: string;
  ic_pack_unit_name: string;
  ic_pack_length_mm: string;
  ic_pack_width_mm: string;
  ic_pack_height_mm: string;
  ic_pack_weight_grams: string;
  items_per_master_pack: string;
  master_pack_unit_name: string;
  master_pack_length_mm: string;
  master_pack_width_mm: string;
  master_pack_height_mm: string;
  master_pack_weight_grams: string;
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

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const QR_TYPE_COLORS: Record<string, string> = {
  dynamic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  secure_qr_runtime: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  static_qr: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

const QR_TYPE_LABELS: Record<string, string> = {
  dynamic: 'Dynamic',
  secure_qr_runtime: 'Secure QR Runtime',
  static_qr: 'Static QR',
};

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
  items_per_ic_pack: '',
  ic_pack_unit_name: '',
  ic_pack_length_mm: '',
  ic_pack_width_mm: '',
  ic_pack_height_mm: '',
  ic_pack_weight_grams: '',
  items_per_master_pack: '',
  master_pack_unit_name: '',
  master_pack_length_mm: '',
  master_pack_width_mm: '',
  master_pack_height_mm: '',
  master_pack_weight_grams: '',
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
  error?: string;
  disabled?: boolean;
}

function BrandSelectSection({ brandId, onBrandChange, error, disabled = false }: BrandSelectSectionProps) {
  const { data, loading } = useBrands();
  const brands = data?.brands ?? [];

  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Brand" />
      <div className="space-y-1">
        <LabelWithTooltip
          label="Brand"
          required
          hint="Select the brand this product belongs to. The brand's ECDSA key pair will be used to sign QR codes."
        />
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
        {error && <p className="text-xs text-destructive">{error}</p>}
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
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors ${error ? 'border-destructive' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">Drag &amp; drop {label.toLowerCase()} here or</span>
          <Button type="button" variant="default" size="sm">
            Choose File
          </Button>
          <span className="text-xs text-muted-foreground">{sizeHint}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ImageDropZone
          label="Logo"
          hint="The logo will be displayed on authentication pages and certificates"
          sizeHint="Recommended size: 300x300px (PNG, JPG, WebP)"
          value={imageUrl}
          error={logoError}
          onFileSelect={onImageSelect}
          onRemove={onImageRemove}
        />
        <ImageDropZone
          label="Banner Image"
          hint="The banner image will be displayed above product content"
          sizeHint="Recommended size: 1200x400px (PNG, JPG, WebP)"
          value={bannerImageUrl}
          error={bannerError}
          onFileSelect={onBannerSelect}
          onRemove={onBannerRemove}
        />
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
  skuServerError?: string;
  onSkuChange?: () => void;
  isEdit?: boolean;
}

function ProductInfoSection({
  register,
  control,
  errors,
  shelfLifeSettings,
  shelfLifeLoading,
  shelfLifeError,
  skuServerError,
  onSkuChange,
  isEdit = false,
}: ProductInfoSectionProps) {
  const nameField = register('name', {
    validate: (value) => value.trim().length > 0 || 'Product name is required',
  });
  const skuField = register('sku');
  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Product Information" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="name" label="Product Name" required hint="The official name of your product as it should appear to customers" />
          <Input id="name" placeholder="Product name" aria-invalid={Boolean(errors.name)} {...nameField} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="gtin" label="GTIN" required={!isEdit} hint="Global Trade Item Number — up to 20 characters" />
          <Input
            id="gtin"
            maxLength={20}
            placeholder="e.g. 012345678901"
            {...register('gtin', {
              // GTIN is nullable on existing products, so only require it when creating.
              ...(isEdit ? {} : { required: 'GTIN is required' }),
              maxLength: { value: 20, message: 'GTIN cannot exceed 20 characters' },
            })}
          />
          {errors.gtin && <p className="text-xs text-destructive">{errors.gtin.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="sku" label="SKU" hint="Stock Keeping Unit — a unique identifier for this product variant" />
          <Input
            id="sku"
            placeholder="e.g. PROD-001-BLK"
            aria-invalid={Boolean(errors.sku || skuServerError)}
            {...skuField}
            onChange={(event) => {
              skuField.onChange(event);
              onSkuChange?.();
            }}
          />
          {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
          {skuServerError && !errors.sku && (
            <p className="text-xs text-destructive" role="alert">
              {skuServerError}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="industry" label="Industry" hint="Industry or sector this product belongs to" />
          <Input id="industry" placeholder="e.g. Pharmaceuticals" {...register('industry')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="shelf_life_setting_id" label="Shelf Life" required hint="Select a Shelf Life value configured in Settings" />
          <Controller
            name="shelf_life_setting_id"
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
            )}
          />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <LabelWithTooltip
            htmlFor="unit_name"
            label="Unit of Measure (UMO)"
            required
            hint="The unit in which the product is sold, e.g. Each, Box, Bottle"
          />
          <Input id="unit_name" placeholder="e.g. Each" {...register('unit_name', { required: 'Unit of measure is required' })} />
          {errors.unit_name && <p className="text-xs text-destructive">{errors.unit_name.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip
            htmlFor="conversion_factor"
            label="Conversion Factor"
            required
            hint="Number of base units that make up this packaging unit (e.g. 12 for a case of 12 bottles)"
          />
          <Input
            id="conversion_factor"
            type="number"
            min={0}
            placeholder="e.g. 1"
            {...register('conversion_factor', {
              required: 'Conversion factor is required',
              min: { value: 0, message: 'Must be greater than or equal to 0' },
            })}
          />
          {errors.conversion_factor && <p className="text-xs text-destructive">{errors.conversion_factor.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="length_mm" label="Length (mm)" hint="Length of the product/package in millimeters" />
          <Input id="length_mm" type="number" min={0} placeholder="e.g. 100" {...register('length_mm')} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor="width_mm" label="Width (mm)" hint="Width of the product/package in millimeters" />
          <Input id="width_mm" type="number" min={0} placeholder="e.g. 50" {...register('width_mm')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

// ─── Inner Carton (IC) & Master Pack (MC) ─────────────────────────────────────

interface PackFieldsProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  unitField: keyof FormValues;
  itemsField: keyof FormValues;
  lengthField: keyof FormValues;
  widthField: keyof FormValues;
  heightField: keyof FormValues;
  weightField: keyof FormValues;
  itemsLabel: string;
  unitPlaceholder: string;
}

/** Shared dimension/weight inputs for an inner-carton or master-pack group. */
function PackFields({
  register,
  unitField,
  itemsField,
  lengthField,
  widthField,
  heightField,
  weightField,
  itemsLabel,
  unitPlaceholder,
}: PackFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={unitField} label="Unit Name" hint="Name of this packaging unit, e.g. Inner Carton, Master Pack" />
          <Input id={unitField} placeholder={unitPlaceholder} {...register(unitField)} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={itemsField} label={itemsLabel} hint="Number of base units contained in one pack" />
          <Input id={itemsField} type="number" min={1} placeholder="e.g. 10" {...register(itemsField)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={lengthField} label="Length (mm)" hint="Length of the pack in millimeters" />
          <Input id={lengthField} type="number" min={0} placeholder="e.g. 100" {...register(lengthField)} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={widthField} label="Width (mm)" hint="Width of the pack in millimeters" />
          <Input id={widthField} type="number" min={0} placeholder="e.g. 50" {...register(widthField)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={heightField} label="Height (mm)" hint="Height of the pack in millimeters" />
          <Input id={heightField} type="number" min={0} placeholder="e.g. 30" {...register(heightField)} />
        </div>
        <div className="space-y-1">
          <LabelWithTooltip htmlFor={weightField} label="Weight (g)" hint="Gross weight of the pack in grams" />
          <Input id={weightField} type="number" min={0} placeholder="e.g. 250" {...register(weightField)} />
        </div>
      </div>
    </>
  );
}

interface PackSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
}

function InnerCartonSection({ register }: PackSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Package} title="Inner Carton (IC) Pack" />
      <PackFields
        register={register}
        unitField="ic_pack_unit_name"
        itemsField="items_per_ic_pack"
        lengthField="ic_pack_length_mm"
        widthField="ic_pack_width_mm"
        heightField="ic_pack_height_mm"
        weightField="ic_pack_weight_grams"
        itemsLabel="Items per IC Pack"
        unitPlaceholder="e.g. Inner Carton"
      />
    </div>
  );
}

function MasterPackSection({ register }: PackSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Package} title="Master Pack (MC)" />
      <PackFields
        register={register}
        unitField="master_pack_unit_name"
        itemsField="items_per_master_pack"
        lengthField="master_pack_length_mm"
        widthField="master_pack_width_mm"
        heightField="master_pack_height_mm"
        weightField="master_pack_weight_grams"
        itemsLabel="Items per Master Pack"
        unitPlaceholder="e.g. Master Pack"
      />
    </div>
  );
}

// ─── Product URLs ─────────────────────────────────────────────────────────────

interface ProductUrlsSectionProps {
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  redirectToClient: boolean;
}

function ProductUrlsSection({ register, errors, redirectToClient }: ProductUrlsSectionProps) {
  const clientAuthUrlRules = {
    validate: (value: string) => validateHttpUrl(value, redirectToClient, 'Product auth URL'),
  };
  return (
    <div className="space-y-3">
      <SectionHeader icon={Link} title="Product URLs" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <LabelWithTooltip
            htmlFor="landing_page"
            label="Landing Page"
            required
            hint="Main product page URL where customers can learn about this product"
          />
          <Input
            id="landing_page"
            type="url"
            inputMode="url"
            placeholder="https://..."
            {...register('landing_page', {
              required: 'Landing page is required',
              validate: (value) => validateHttpUrl(value, true, 'Landing page'),
            })}
          />
          {errors.landing_page && <p className="text-xs text-destructive">{errors.landing_page.message}</p>}
        </div>
        <div className="space-y-1">
          <LabelWithTooltip
            htmlFor="client_product_auth_url"
            label="Product Auth URL"
            required={redirectToClient}
            hint="Used when Redirect to Product URL after QR scan is enabled"
          />
          {redirectToClient ? (
            <>
              <Input
                id="client_product_auth_url"
                type="url"
                inputMode="url"
                placeholder="https://..."
                {...register('client_product_auth_url', clientAuthUrlRules)}
              />
              {errors.client_product_auth_url && <p className="text-xs text-destructive">{errors.client_product_auth_url.message}</p>}
            </>
          ) : (
            <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Optional. Enable redirect below if scans should open a customer-facing URL.
            </p>
          )}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <LabelWithTooltip
            label="Activation Method"
            required
            hint="Choose how customers will activate this product (pre-activated or post-activation)"
          />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <p className="text-xs text-muted-foreground">
        When enabled, scans open the Product Auth URL above. When disabled, scans stay on the standard verification experience.
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyToNull(val: string): string | null {
  return val || null;
}

function validateHttpUrl(value: string, required: boolean, label: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return required ? `${label} is required` : true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return true;
    }
  } catch {
    // Return the same concise validation message below.
  }

  return `${label} must be a valid http:// or https:// URL`;
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

// eslint-disable-next-line complexity
function buildPayload(data: FormValues): CreateQSealProductPayload {
  const n = emptyToNull;
  return {
    name: data.name.trim(),
    sku: n(data.sku),
    packaging_details: {
      unit_name: data.unit_name,
      conversion_factor: Number(data.conversion_factor) || 0,
      length_mm: data.length_mm ? Number(data.length_mm) : null,
      width_mm: data.width_mm ? Number(data.width_mm) : null,
      height_mm: data.height_mm ? Number(data.height_mm) : null,
      weight_grams: data.weight_grams ? Number(data.weight_grams) : null,
      items_per_ic_pack: data.items_per_ic_pack ? Number(data.items_per_ic_pack) : null,
      ic_pack_unit_name: n(data.ic_pack_unit_name),
      ic_pack_length_mm: data.ic_pack_length_mm ? Number(data.ic_pack_length_mm) : null,
      ic_pack_width_mm: data.ic_pack_width_mm ? Number(data.ic_pack_width_mm) : null,
      ic_pack_height_mm: data.ic_pack_height_mm ? Number(data.ic_pack_height_mm) : null,
      ic_pack_weight_grams: data.ic_pack_weight_grams ? Number(data.ic_pack_weight_grams) : null,
      items_per_master_pack: data.items_per_master_pack ? Number(data.items_per_master_pack) : null,
      master_pack_unit_name: n(data.master_pack_unit_name),
      master_pack_length_mm: data.master_pack_length_mm ? Number(data.master_pack_length_mm) : null,
      master_pack_width_mm: data.master_pack_width_mm ? Number(data.master_pack_width_mm) : null,
      master_pack_height_mm: data.master_pack_height_mm ? Number(data.master_pack_height_mm) : null,
      master_pack_weight_grams: data.master_pack_weight_grams ? Number(data.master_pack_weight_grams) : null,
    },
    brand_id: n(data.brand_id),
    gtin: n(data.gtin),
    industry: n(data.industry),
    landing_page: n(data.landing_page),
    client_product_auth_url: data.redirect_to_client ? n(data.client_product_auth_url) : null,
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

// eslint-disable-next-line complexity
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
    items_per_ic_pack: optionalNumber(pd?.items_per_ic_pack, ''),
    ic_pack_unit_name: optionalString(pd?.ic_pack_unit_name, ''),
    ic_pack_length_mm: optionalNumber(pd?.ic_pack_length_mm, ''),
    ic_pack_width_mm: optionalNumber(pd?.ic_pack_width_mm, ''),
    ic_pack_height_mm: optionalNumber(pd?.ic_pack_height_mm, ''),
    ic_pack_weight_grams: optionalNumber(pd?.ic_pack_weight_grams, ''),
    items_per_master_pack: optionalNumber(pd?.items_per_master_pack, ''),
    master_pack_unit_name: optionalString(pd?.master_pack_unit_name, ''),
    master_pack_length_mm: optionalNumber(pd?.master_pack_length_mm, ''),
    master_pack_width_mm: optionalNumber(pd?.master_pack_width_mm, ''),
    master_pack_height_mm: optionalNumber(pd?.master_pack_height_mm, ''),
    master_pack_weight_grams: optionalNumber(pd?.master_pack_weight_grams, ''),
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
  saveError?: { field?: 'sku'; message: string } | null;
  onClearSaveError?: () => void;
}

const PRODUCT_FORM_STEPS = ['Basics', 'Packaging', 'QR setup', 'Review'] as const;
const PRODUCT_STEP_FIELDS: Array<Array<keyof FormValues>> = [
  ['name', 'gtin', 'shelf_life_setting_id'],
  ['unit_name', 'conversion_factor'],
  ['landing_page', 'client_product_auth_url', 'serial_prefix_setting_id'],
  [],
];

function ReviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(step)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ProductReviewSummary({
  values,
  shelfLifeSettings,
  serialPrefixSettings,
  onEditStep,
}: {
  values: FormValues;
  shelfLifeSettings: QRProductSetting[];
  serialPrefixSettings: QRProductSetting[];
  onEditStep: (step: number) => void;
}) {
  const shelfLife = shelfLifeSettings.find((setting) => setting.id === values.shelf_life_setting_id)?.label;
  const serialPrefix = serialPrefixSettings.find((setting) => setting.id === values.serial_prefix_setting_id);
  const serialPrefixLabel = serialPrefix ? `${serialPrefix.value} — ${serialPrefix.label}` : values.serial_prefix_setting_id;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 p-4">
        <p className="font-semibold">Review before saving</p>
        <p className="mt-1 text-sm text-muted-foreground">Confirm the product identity, QR configuration, and customer-facing URLs.</p>
      </div>
      <div className="space-y-3">
        <ReviewSection title="Product basics" step={0} onEdit={onEditStep}>
          <ReviewField label="Product name" value={values.name} />
          <ReviewField label="GTIN" value={values.gtin} />
          <ReviewField label="SKU" value={values.sku} />
          <ReviewField label="Industry" value={values.industry} />
          <ReviewField label="Shelf life" value={shelfLife || values.shelf_life_setting_id} />
        </ReviewSection>
        <ReviewSection title="Packaging" step={1} onEdit={onEditStep}>
          <ReviewField label="Unit of measure" value={`${values.unit_name} × ${values.conversion_factor}`} />
        </ReviewSection>
        <ReviewSection title="QR setup" step={2} onEdit={onEditStep}>
          <ReviewField label="Activation method" value={values.activation_method === 'post' ? 'Post-Activated' : 'Pre-Activated'} />
          <ReviewField label="Serial number type" value={values.sr_number_type} />
          <ReviewField label="Serial prefix" value={serialPrefixLabel} />
          <ReviewField label="Landing page" value={values.landing_page} />
          {values.redirect_to_client && <ReviewField label="Product auth URL" value={values.client_product_auth_url} />}
          <ReviewField label="Redirect after scan" value={values.redirect_to_client ? 'Yes' : 'No'} />
        </ReviewSection>
      </div>
    </div>
  );
}

export function QSealProductDialog({ open, onOpenChange, product, onSave, saving, saveError, onClearSaveError }: QSealProductDialogProps) {
  const isEdit = !!product;
  const { settings, loading: shelfLifeLoading, error: shelfLifeError } = useQRProductSettings('shelf_life');
  const { settings: serialPrefixSettingsData, loading: serialPrefixLoading, error: serialPrefixError } = useQRProductSettings('serial_prefix');
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
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
  const [brandRequiredError, setBrandRequiredError] = React.useState<string | undefined>(undefined);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);

  const brandId = watch('brand_id');
  const activationMethod = watch('activation_method');
  const srNumberType = watch('sr_number_type');
  const serialPrefixSettingId = watch('serial_prefix_setting_id');
  const redirectToClient = watch('redirect_to_client');
  const imageUrl = watch('image_url');
  const bannerImageUrl = watch('banner_image_url');
  const formValues = watch();
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
      setCurrentStep(0);
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
      setBrandRequiredError(undefined);
      setDiscardDialogOpen(false);
    }
  }, [open, product, reset]);

  React.useEffect(() => {
    if (saveError) {
      setCurrentStep(saveError.field === 'sku' ? 0 : PRODUCT_FORM_STEPS.length - 1);
    }
  }, [saveError]);

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

  const hasUnsavedChanges = isDirty || Boolean(logoFile || bannerFile || removeLogo || removeBanner);
  const requestClose = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (saving) return;
    if (hasUnsavedChanges) {
      setDiscardDialogOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const discardChanges = () => {
    setDiscardDialogOpen(false);
    onOpenChange(false);
  };

  const handleSubmitForm = (event: React.FormEvent) => {
    event.preventDefault();

    if (logoError || bannerError) return;

    if (!isEdit && !brandId) {
      setBrandRequiredError('Brand is required. Please select a brand.');
      setCurrentStep(0);
      return;
    }

    if (!isEdit) {
      const logoRequired = getRequiredImageError(logoFile, removeLogo, imageUrl, 'Logo');
      const bannerRequired = getRequiredImageError(bannerFile, removeBanner, bannerImageUrl, 'Banner image');

      setLogoRequiredError(logoRequired);
      setBannerRequiredError(bannerRequired);

      if (logoRequired || bannerRequired) return;
    }

    return submitValidForm(event);
  };

  const goToNextStep = async () => {
    const fields = PRODUCT_STEP_FIELDS[currentStep];
    const valid = fields.length ? await trigger(fields) : true;

    if (currentStep === 0 && !isEdit) {
      const brandRequired = brandId ? undefined : 'Brand is required. Please select a brand.';
      setBrandRequiredError(brandRequired);
      if (brandRequired) return;

      const logoRequired = getRequiredImageError(logoFile, removeLogo, imageUrl, 'Logo');
      const bannerRequired = getRequiredImageError(bannerFile, removeBanner, bannerImageUrl, 'Banner image');
      setLogoRequiredError(logoRequired);
      setBannerRequiredError(bannerRequired);
      if (logoRequired || bannerRequired) return;
    }

    if (valid) setCurrentStep((step) => Math.min(step + 1, PRODUCT_FORM_STEPS.length - 1));
  };

  function ProductBadges({ product }: { product: QSealProduct | null }) {
    const statusLabel = product?.is_active ? 'Active' : 'Inactive';
    const statusColor = product?.is_active ? STATUS_COLORS.active : STATUS_COLORS.inactive;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={statusColor}>
          {statusLabel}
        </Badge>
        {product?.qr_type && (
          <Badge variant="secondary" className={QR_TYPE_COLORS[product.qr_type] || ''}>
            {QR_TYPE_LABELS[product.qr_type] || product.qr_type}
          </Badge>
        )}
        {product?.industry && (
          <Badge variant="outline" className="gap-1">
            <Tag className="h-3 w-3" />
            {product.industry}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={requestClose}
        // title={isEdit ? 'Edit QSeal Product' : 'Create New Product'}
        title={
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{isEdit ? 'Edit Product' : 'Create New Product'}</p>
                <div className="space-y-3">
                  {isEdit && product?.name && <p className="text-xs text-muted-foreground font-mono font-normal">{product.name}</p>}
                </div>
                {product?.gtin && <p className="text-xs text-muted-foreground font-mono font-normal">{product.gtin}</p>}
              </div>
            </div>
            <ProductBadges product={product ?? null} />
          </div>
        }
        size="lg"
        contentClassName="max-w-4xl flex flex-col"
        style={{ height: 'min(85vh, 820px)' }}
        showCloseButton={false}
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {PRODUCT_FORM_STEPS.length}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={saving}>
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={() => setCurrentStep((step) => step - 1)} disabled={saving}>
                  Back
                </Button>
              )}
              {currentStep < PRODUCT_FORM_STEPS.length - 1 ? (
                <Button type="button" onClick={() => void goToNextStep()} disabled={saving}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" form="qseal-product-form" disabled={saving}>
                  {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form id="qseal-product-form" onSubmit={handleSubmitForm} noValidate>
          <div className="mb-6 grid grid-cols-4 gap-2" aria-label="Product creation progress">
            {PRODUCT_FORM_STEPS.map((step, index) => (
              <div key={step} className="space-y-2">
                <div className={`h-1 rounded-full ${index <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                <p className={`text-center text-xs ${index === currentStep ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{step}</p>
              </div>
            ))}
          </div>

          {saveError && saveError.field !== 'sku' && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {saveError.message}
            </div>
          )}

          {currentStep === 0 && (
            <>
              <BrandSelectSection
                brandId={brandId}
                error={brandRequiredError}
                onBrandChange={(v) => {
                  setValue('brand_id', v, { shouldDirty: true });
                  setBrandRequiredError(undefined);
                }}
                disabled={isEdit}
              />
              <Separator />
              <ProductImagesSection
                imageUrl={getDisplayedImageUrl(logoPreview, imageUrl, removeLogo)}
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
                }}
              />
              <Separator />
              <ProductInfoSection
                register={register}
                control={control}
                errors={errors}
                shelfLifeSettings={shelfLifeSettings}
                shelfLifeLoading={shelfLifeLoading}
                shelfLifeError={shelfLifeError}
                skuServerError={saveError?.field === 'sku' ? saveError.message : undefined}
                onSkuChange={onClearSaveError}
                isEdit={isEdit}
              />
            </>
          )}

          {currentStep === 1 && (
            <>
              <PackagingDetailsSection register={register} errors={errors} />
              <Separator />
              <InnerCartonSection register={register} />
              <Separator />
              <MasterPackSection register={register} />
            </>
          )}

          {currentStep === 2 && (
            <>
              <ProductUrlsSection register={register} errors={errors} redirectToClient={redirectToClient} />
              <Separator />
              <input type="hidden" {...register('serial_prefix_setting_id', { required: 'Serial prefix is required' })} />
              <ActivationDetailsSection
                activationMethod={activationMethod}
                srNumberType={srNumberType}
                serialPrefixSettingId={serialPrefixSettingId}
                serialPrefixSettings={serialPrefixSettings}
                serialPrefixLoading={serialPrefixLoading}
                serialPrefixError={serialPrefixError}
                serialPrefixValidationError={errors.serial_prefix_setting_id?.message}
                onActivationChange={(v) => setValue('activation_method', v, { shouldDirty: true })}
                onSrNumberChange={(v) => setValue('sr_number_type', v, { shouldDirty: true })}
                onSerialPrefixChange={(v) => setValue('serial_prefix_setting_id', v, { shouldValidate: true })}
              />
              <Separator />
              <AdditionalDetailsSection
                register={register}
                redirectToClient={redirectToClient}
                onRedirectChange={(checked) => setValue('redirect_to_client', checked, { shouldDirty: true })}
              />
            </>
          )}

          {currentStep === 3 && (
            <ProductReviewSummary
              values={formValues}
              shelfLifeSettings={shelfLifeSettings}
              serialPrefixSettings={serialPrefixSettings}
              onEditStep={setCurrentStep}
            />
          )}
        </form>
      </DetailDialog>
      <ConfirmationDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title="Discard unsaved changes?"
        description="Your changes to this product will be lost if you close the form."
        confirmLabel="Discard changes"
        variant="destructive"
        onConfirm={discardChanges}
      />
    </>
  );
}
