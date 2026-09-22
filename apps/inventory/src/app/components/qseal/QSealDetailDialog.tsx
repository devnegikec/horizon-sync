import { Clock, Image, Info, Link, MoreHorizontal, QrCode, Tag } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components';
import { DetailDialog } from '@horizon-sync/ui/components/ui/detail-dialog';

import { useBrands } from '../../features/qr-management/hooks/useBrands';
import { useQRProductSettings } from '../../hooks/useQRProductSettings';
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

const ACTIVATION_LABELS: Record<string, string> = {
  pre: 'Pre-Activated',
  post: 'Post-Activated',
};

const SR_NUMBER_LABELS: Record<string, string> = {
  R8DAN: 'Random-8 Digit Alpha Numeric',
  R6DAN: 'Random-6 Digit Alpha Numeric',
  R4DAN: 'Random-4 Digit Alpha Numeric',
  S8DN: 'Serialized-8 Digit Max',
  S10DN: 'Serialized-10 Digit Max',
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
      <p className="text-sm font-medium break-words">{isEmpty ? <span className="text-muted-foreground">—</span> : value}</p>
    </div>
  );
}

function ProductBadges({ product }: { product: QSealProduct }) {
  const statusLabel = product.is_active ? 'Active' : 'Inactive';
  const statusColor = product.is_active ? STATUS_COLORS.active : STATUS_COLORS.inactive;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className={statusColor}>
        {statusLabel}
      </Badge>
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

function ImagePreview({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  return (
    <div className="rounded-lg border overflow-hidden bg-muted/30">
      <img src={src} alt={alt} className="w-full h-32 object-contain" />
    </div>
  );
}

// eslint-disable-next-line complexity
export function QSealDetailDialog({ open, onOpenChange, product }: QSealDetailDialogProps) {
  const { data: brandData } = useBrands();
  const { settings: shelfLifeSettings } = useQRProductSettings('shelf_life');
  const { settings: serialPrefixSettings } = useQRProductSettings('serial_prefix');

  if (!product) return null;

  const brand = brandData?.brands.find((b) => b.id === product.brand_id);
  const shelfLife = shelfLifeSettings.find((s) => s.id === product.shelf_life_setting_id);
  const serialPrefix = serialPrefixSettings.find((s) => s.id === product.serial_prefix_setting_id);

  const brandLabel = brand ? `${brand.name}${brand.short_code ? ` (${brand.short_code})` : ''}` : (product.brand_id ?? '—');
  const shelfLifeLabel = shelfLife?.label ?? product.shelf_life_setting_id ?? '—';
  const serialPrefixLabel = serialPrefix
    ? `${serialPrefix.value} — ${serialPrefix.label}`
    : (product.serial_prefix ?? product.serial_prefix_setting_id ?? '—');
  const activationLabel = ACTIVATION_LABELS[product.activation_method] ?? product.activation_method ?? '—';
  const srNumberLabel = SR_NUMBER_LABELS[product.sr_number_type ?? ''] ?? product.sr_number_type ?? '—';

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{product.name}</p>
              {product.gtin && <p className="text-xs text-muted-foreground font-mono font-normal">{product.gtin}</p>}
            </div>
          </div>
          <ProductBadges product={product} />
        </div>
      }>
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionHeader icon={Info} title="Brand" />
          <Field label="Brand" value={brandLabel} />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Image} title="Product Images" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Logo</p>
              <ImagePreview src={product.image_url} alt="Logo" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Banner Image</p>
              <ImagePreview src={product.banner_image_url} alt="Banner Image" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Info} title="Product Information" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product Name" value={product.name} />
            <Field label="GTIN" value={product.gtin} />
            <Field label="Industry" value={product.industry} />
            <Field label="Shelf Life" value={shelfLifeLabel} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Link} title="Product URLs" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Landing Page" value={product.landing_page} />
            <Field label="Product Auth URL" value={product.client_product_auth_url} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Clock} title="Activation Details" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Activation Method" value={activationLabel} />
            <Field label="Serial Number Type" value={srNumberLabel} />
            <Field label="Serial Prefix" value={serialPrefixLabel} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={MoreHorizontal} title="Additional Details" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email" value={product.email} />
            <Field label="Contact Phone" value={product.phone_number} />
            {product.generic_name != null && <Field label="Generic Name" value={product.generic_name} />}
            {product.sku != null && <Field label="SKU" value={product.sku} />}
            {product.warranty_period_months != null && <Field label="Warranty (months)" value={product.warranty_period_months} />}
          </div>
          <Field label="Redirect to Product URL after QR scan" value={product.redirect_to_client ? 'Yes' : 'No'} />
        </div>

        <div className="divide-y">
          <Field label="Created" value={formatDate(product.created_at, 'DD-MMM-YY')} />
          <Field label="Last Updated" value={formatDate(product.updated_at, 'DD-MMM-YY')} />
        </div>
      </div>
    </DetailDialog>
  );
}
