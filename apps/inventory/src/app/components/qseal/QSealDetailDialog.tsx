import * as React from 'react';

import { Box, CheckCircle2, Clock, Edit, Image, Info, Layers, Link, MoreHorizontal, Power, PowerOff, QrCode, ScanLine, Tag } from 'lucide-react';

import { getUserDisplayName, useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
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
  onEdit?: () => void;
  onToggleStatus?: () => void;
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

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function formatDimensions(length?: number | null, width?: number | null, height?: number | null) {
  if (length == null || width == null || height == null) return null;
  return `${length} × ${width} × ${height} mm`;
}

function PackagingOverview({ product }: { product: QSealProduct }) {
  const packaging = product.packaging_details;
  if (!packaging) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Packaging details have not been configured for this product.
      </div>
    );
  }

  const levels = [
    {
      label: 'Base unit',
      unitName: packaging.unit_name,
      quantity: packaging.conversion_factor,
      dimensions: formatDimensions(packaging.length_mm, packaging.width_mm, packaging.height_mm),
      weight: packaging.weight_grams,
    },
    {
      label: 'Inner carton',
      unitName: packaging.ic_pack_unit_name,
      quantity: packaging.items_per_ic_pack,
      dimensions: formatDimensions(packaging.ic_pack_length_mm, packaging.ic_pack_width_mm, packaging.ic_pack_height_mm),
      weight: packaging.ic_pack_weight_grams,
    },
    {
      label: 'Master carton',
      unitName: packaging.master_pack_unit_name,
      quantity: packaging.items_per_master_pack,
      dimensions: formatDimensions(packaging.master_pack_length_mm, packaging.master_pack_width_mm, packaging.master_pack_height_mm),
      weight: packaging.master_pack_weight_grams,
    },
  ].filter((level) => level.unitName || level.quantity != null);

  return (
    <div className="space-y-3">
      {levels.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Packaging details have not been configured for this product.
        </div>
      ) : (
        <div className="space-y-2">
          {levels.map((level) => (
            <div key={level.label} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <Box className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-sm text-muted-foreground">
                  {level.quantity != null ? `${level.quantity} ` : ''}
                  {level.unitName || 'items'}
                </p>
                {(level.dimensions || level.weight != null) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[level.dimensions, level.weight != null ? `${level.weight} g` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ label, date, detail }: { label: string; date: string; detail?: string }) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <div className="relative z-10 mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {date}
          {detail ? ` · ${detail}` : ''}
        </p>
      </div>
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
export function QSealDetailDialog({ open, onOpenChange, product, onEdit, onToggleStatus }: QSealDetailDialogProps) {
  const { data: brandData } = useBrands();
  const { settings: shelfLifeSettings } = useQRProductSettings('shelf_life');
  const { settings: serialPrefixSettings } = useQRProductSettings('serial_prefix');
  const currentUser = useUserStore((state) => state.user);

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
  const creatorLabel =
    product.created_by_name ||
    (product.created_by && product.created_by === currentUser?.id ? getUserDisplayName(currentUser) : null) ||
    (product.created_by ? 'Organization user' : '—');
  const statusLabel = product.is_active ? 'Active' : 'Inactive';

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="left-auto right-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-xl translate-x-0 translate-y-0 rounded-none p-0 flex flex-col gap-0 sm:rounded-l-xl"
      showCloseButton={true}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {onToggleStatus && (
              <Button type="button" variant="outline" onClick={onToggleStatus}>
                {product.is_active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {product.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            )}
            {onEdit && (
              <Button type="button" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      }
      title={
        <div className="space-y-3 border-b px-6 py-5 pr-14">
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
      }
    >
      <div className="space-y-6 p-1 sm:p-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard icon={Layers} label="QR Blocks" value={product.block_count == null ? '—' : product.block_count.toLocaleString()} />
          <MetricCard icon={QrCode} label="QR Codes" value={product.qr_code_count == null ? '—' : product.qr_code_count.toLocaleString()} />
          <MetricCard icon={ScanLine} label="Scans" value={product.scan_count == null ? '—' : product.scan_count.toLocaleString()} />
          <MetricCard
            icon={Clock}
            label="Status"
            value={statusLabel}
            detail={product.last_scan_at ? `Last scan ${formatDate(product.last_scan_at, 'DD-MMM-YY')}` : 'Never scanned'}
          />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Info} title="Brand" />
          <Field label="Brand" value={brandLabel} />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Image} title="Product Images" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product Name" value={product.name} />
            <Field label="GTIN" value={product.gtin} />
            <Field label="Industry" value={product.industry} />
            <Field label="Shelf Life" value={shelfLifeLabel} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Layers} title="Packaging Structure" />
          <PackagingOverview product={product} />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Link} title="Product URLs" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Landing Page" value={product.landing_page} />
            <Field label="Product Auth URL" value={product.client_product_auth_url} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Clock} title="Activation Details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Activation Method" value={activationLabel} />
            <Field label="Serial Number Type" value={srNumberLabel} />
            <Field label="Serial Prefix" value={serialPrefixLabel} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={MoreHorizontal} title="Additional Details" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Email" value={product.email} />
            <Field label="Contact Phone" value={product.phone_number} />
            {product.generic_name != null && <Field label="Generic Name" value={product.generic_name} />}
            {product.sku != null && <Field label="SKU" value={product.sku} />}
            {product.warranty_period_months != null && <Field label="Warranty (months)" value={product.warranty_period_months} />}
          </div>
          <Field label="Redirect to Product URL after QR scan" value={product.redirect_to_client ? 'Yes' : 'No'} />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Clock} title="Activity" />
          <div className="relative pl-1">
            <div className="absolute bottom-1 left-[13px] top-1 w-px bg-border" />
            <ActivityItem
              label="Product created"
              date={formatDate(product.created_at, 'DD-MMM-YY', { includeTime: true })}
              detail={`Created by ${creatorLabel}`}
            />
            <ActivityItem label="Product last updated" date={formatDate(product.updated_at, 'DD-MMM-YY', { includeTime: true })} />
          </div>
        </div>
      </div>
    </DetailDialog>
  );
}
