import { Box, Calendar, Info, Layers, Link, Mail, QrCode, Tag } from 'lucide-react';

import { Badge, DetailDialog } from '@horizon-sync/ui/components';

import type { QSealProduct } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const QR_TYPE_LABELS: Record<string, string> = {
  dynamic: 'Dynamic',
  secure_qr_runtime: 'Secure QR Runtime',
  static_qr: 'Static QR',
};

const QR_TYPE_COLORS: Record<string, string> = {
  dynamic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  secure_qr_runtime: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  static_qr: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

interface QSealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: QSealProduct | null;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Icon className="h-4 w-4" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </p>
    </div>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean | null | undefined }) {
  return <Field label={label} value={value == null ? undefined : value ? 'Yes' : 'No'} />;
}

function ProductBadges({ product }: { product: QSealProduct }) {
  const statusLabel = product.is_active ? 'Active' : 'Inactive';
  const statusColor = product.is_active ? STATUS_COLORS.active : STATUS_COLORS.inactive;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className={statusColor}>{statusLabel}</Badge>
      {product.qr_type && (
        <Badge variant="secondary" className={QR_TYPE_COLORS[product.qr_type] || ''}>
          {QR_TYPE_LABELS[product.qr_type] || product.qr_type}
        </Badge>
      )}
      {product.industry && (
        <Badge variant="outline" className="gap-1">
          <Tag className="h-3 w-3" />
          {product.industry}
        </Badge>
      )}
    </div>
  );
}

function ProductInfoSection({ product }: { product: QSealProduct }) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Info} title="Product Information" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" value={product.brand_name} />
        <Field label="Generic Name" value={product.generic_name} />
        <Field label="SKU" value={product.sku} />
        <Field label="GTIN" value={product.gtin} />
        <Field label="Industry" value={product.industry} />
        <Field
          label="QR Type"
          value={product.qr_type ? QR_TYPE_LABELS[product.qr_type] || product.qr_type : undefined}
        />
        <Field label="Activation Method" value={product.activation_method} />
        <Field label="SR Number Type" value={product.sr_number_type} />
        <Field label="Warranty (months)" value={product.warranty_period_months} />
        <BooleanField label="Redirect to Client" value={product.redirect_to_client} />
      </div>
    </div>
  );
}

function LinksSection({ product }: { product: QSealProduct }) {
  if (!product.landing_page && !product.client_product_auth_url && !product.image_url && !product.banner_image_url) {
    return null;
  }
  return (
    <div className="space-y-3">
      <SectionHeader icon={Link} title="Links" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Landing Page" value={product.landing_page} />
        <Field label="Product Auth URL" value={product.client_product_auth_url} />
        <Field label="Image URL" value={product.image_url} />
        <Field label="Banner Image URL" value={product.banner_image_url} />
      </div>
    </div>
  );
}

function ContactSection({ product }: { product: QSealProduct }) {
  if (!product.email && !product.phone_number) {
    return null;
  }
  return (
    <div className="space-y-3">
      <SectionHeader icon={Mail} title="Contact" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" value={product.email} />
        <Field label="Phone" value={product.phone_number} />
      </div>
    </div>
  );
}

function PackagingSection({ product }: { product: QSealProduct }) {
  const extra = (product.extra_data as Record<string, unknown> | null | undefined) ?? {};
  const packaging = (extra.packaging_details as Record<string, unknown> | null | undefined) ?? {};
  const hasPackaging = product.items_per_master_pack != null || Object.keys(packaging).length > 0;
  if (!hasPackaging) return null;

  const hasDims = packaging.length_mm != null || packaging.width_mm != null || packaging.height_mm != null;

  return (
    <div className="space-y-3">
      <SectionHeader icon={Box} title="Packaging" />
      <div className="grid grid-cols-2 gap-4">
        {packaging.unit_name != null && <Field label="Base Unit" value={String(packaging.unit_name)} />}
        {packaging.conversion_factor != null && <Field label="Conversion Factor" value={String(packaging.conversion_factor)} />}
        {product.items_per_master_pack != null && <Field label="Items per Master Pack" value={product.items_per_master_pack} />}
        {hasDims && (
          <Field
            label="Dimensions (L × W × H)"
            value={`${packaging.length_mm ?? '—'} × ${packaging.width_mm ?? '—'} × ${packaging.height_mm ?? '—'} mm`}
          />
        )}
        {packaging.weight_grams != null && <Field label="Weight" value={`${packaging.weight_grams} g`} />}
      </div>
    </div>
  );
}

function InventorySection({ product }: { product: QSealProduct }) {
  const hasContent = !!(
    product.item_code ||
    product.description ||
    product.uom ||
    product.barcode ||
    product.standard_rate != null ||
    product.valuation_rate != null ||
    product.weight_per_unit != null ||
    product.weight_uom ||
    product.item_type ||
    product.valuation_method ||
    product.maintain_stock != null ||
    product.allow_negative_stock != null ||
    product.has_variants != null ||
    product.has_batch_no != null ||
    product.has_serial_no != null ||
    product.enable_auto_reorder != null ||
    product.min_order_qty != null ||
    product.max_order_qty != null
  );

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      <SectionHeader icon={Layers} title="Inventory Details" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Item Code" value={product.item_code} />
        <Field label="Unit of Measure" value={product.uom} />
        <Field label="Barcode" value={product.barcode} />
        <Field label="Item Type" value={product.item_type} />
        <Field label="Standard Rate" value={product.standard_rate} />
        <Field label="Valuation Rate" value={product.valuation_rate} />
        <Field label="Valuation Method" value={product.valuation_method} />
        <Field label="Weight Per Unit" value={product.weight_per_unit} />
        <BooleanField label="Maintain Stock" value={product.maintain_stock} />
        <BooleanField label="Allow Negative Stock" value={product.allow_negative_stock} />
        <BooleanField label="Has Variants" value={product.has_variants} />
        <BooleanField label="Has Batch No" value={product.has_batch_no} />
        <BooleanField label="Has Serial No" value={product.has_serial_no} />
        <BooleanField label="Auto Reorder" value={product.enable_auto_reorder} />
        <Field label="Min Order Qty" value={product.min_order_qty} />
        <Field label="Max Order Qty" value={product.max_order_qty} />
      </div>
      {product.description && <Field label="Description" value={product.description} />}
    </div>
  );
}

function ActivitySection({ product }: { product: QSealProduct }) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Calendar} title="Activity" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Created" value={formatDate(product.created_at, 'DD-MMM-YY')} />
        <Field label="Last Updated" value={formatDate(product.updated_at, 'DD-MMM-YY')} />
      </div>
    </div>
  );
}

export function QSealDetailDialog({ open, onOpenChange, product }: QSealDetailDialogProps) {
  if (!product) return null;

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{product.name}</p>
            {product.gtin && (
              <p className="text-xs text-muted-foreground font-mono font-normal">{product.gtin}</p>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <ProductBadges product={product} />
        <ProductInfoSection product={product} />
        <LinksSection product={product} />
        <ContactSection product={product} />
        <PackagingSection product={product} />
        <InventorySection product={product} />
        <ActivitySection product={product} />
      </div>
    </DetailDialog>
  );
}
