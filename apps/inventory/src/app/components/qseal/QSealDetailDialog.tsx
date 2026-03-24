import { QrCode, Tag } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
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
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Product Details
      </p>
      <div className="divide-y">
        <MetricRow label="Activation Method" value={product.activation_method || '—'} />
        {product.warranty_period_months != null && (
          <MetricRow label="Warranty (months)" value={product.warranty_period_months} />
        )}
        <MetricRow label="Redirect to Client" value={product.redirect_to_client ? 'Yes' : 'No'} />
        {product.landing_page && <MetricRow label="Landing Page" value={product.landing_page} />}
        {product.email && <MetricRow label="Email" value={product.email} />}
        {product.phone_number && <MetricRow label="Phone" value={product.phone_number} />}
      </div>
    </div>
  );
}

export function QSealDetailDialog({ open, onOpenChange, product }: QSealDetailDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{product.name}</p>
              {product.gtin && (
                <p className="text-xs text-muted-foreground font-mono font-normal">{product.gtin}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ProductBadges product={product} />

          {product.generic_name && (
            <p className="text-sm text-muted-foreground">{product.generic_name}</p>
          )}

          <Separator />
          <ProductDetails product={product} />
          <Separator />

          <div className="divide-y">
            <MetricRow label="Created" value={formatDate(product.created_at, 'DD-MMM-YY')} />
            <MetricRow label="Last Updated" value={formatDate(product.updated_at, 'DD-MMM-YY')} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
