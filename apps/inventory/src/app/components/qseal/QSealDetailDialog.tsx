import { QrCode, Tag } from 'lucide-react';

import { Badge, DetailDialog } from '@horizon-sync/ui/components';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

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

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
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

function ProductDetails({ product }: { product: QSealProduct }) {
  const extra = (product.extra_data as Record<string, unknown> | null | undefined) ?? {};
  const packaging = (extra.packaging_details as Record<string, unknown> | null | undefined) ?? {};

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Product Details
        </p>
        <div className="divide-y">
          {product.generic_name && <MetricRow label="Generic Name" value={product.generic_name} />}
          {product.sku && <MetricRow label="SKU" value={product.sku} />}
          <MetricRow label="Activation Method" value={product.activation_method || '—'} />
          {product.sr_number_type && <MetricRow label="SR Number Type" value={product.sr_number_type} />}
          {product.warranty_period_months != null && (
            <MetricRow label="Warranty (months)" value={product.warranty_period_months} />
          )}
          <MetricRow label="Redirect to Client" value={product.redirect_to_client ? 'Yes' : 'No'} />
        </div>
      </div>

      {(product.landing_page || product.client_product_auth_url || product.image_url || product.banner_image_url) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Links</p>
          <div className="divide-y">
            {product.landing_page && <MetricRow label="Landing Page" value={product.landing_page} />}
            {product.client_product_auth_url && <MetricRow label="Product Auth URL" value={product.client_product_auth_url} />}
            {product.image_url && <MetricRow label="Image URL" value={product.image_url} />}
            {product.banner_image_url && <MetricRow label="Banner Image URL" value={product.banner_image_url} />}
          </div>
        </div>
      )}

      {(product.email || product.phone_number) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contact</p>
          <div className="divide-y">
            {product.email && <MetricRow label="Email" value={product.email} />}
            {product.phone_number && <MetricRow label="Phone" value={product.phone_number} />}
          </div>
        </div>
      )}

      {(product.items_per_master_pack != null || Object.keys(packaging).length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Packaging</p>
          <div className="divide-y">
            {product.items_per_master_pack != null && (
              <MetricRow label="Items per Master Pack" value={product.items_per_master_pack} />
            )}
            {packaging.unit_name != null && <MetricRow label="Base Unit" value={String(packaging.unit_name)} />}
            {packaging.conversion_factor != null && (
              <MetricRow label="Conversion Factor" value={String(packaging.conversion_factor)} />
            )}
            {(packaging.length_mm != null || packaging.width_mm != null || packaging.height_mm != null) && (
              <MetricRow
                label="Dimensions (L × W × H)"
                value={`${packaging.length_mm ?? '—'} × ${packaging.width_mm ?? '—'} × ${packaging.height_mm ?? '—'} mm`}
              />
            )}
            {packaging.weight_grams != null && (
              <MetricRow label="Weight" value={`${packaging.weight_grams} g`} />
            )}
          </div>
        </div>
      )}
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
      <div className="space-y-4">
        <ProductBadges product={product} />
        <Separator />
        <ProductDetails product={product} />
        <Separator />

        <div className="divide-y">
          <MetricRow label="Created" value={formatDate(product.created_at, 'DD-MMM-YY')} />
          <MetricRow label="Last Updated" value={formatDate(product.updated_at, 'DD-MMM-YY')} />
        </div>
      </div>
    </DetailDialog>
  );
}
