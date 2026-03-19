import { QrCode, Boxes, ScanLine, Calendar, Tag } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { QSealProduct, QSealProductStatus, QSealQRType } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';

const STATUS_COLORS: Record<QSealProductStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
};

const QR_TYPE_LABELS: Record<QSealQRType, string> = {
  dynamic: 'Dynamic',
  secure_qr_runtime: 'Secure QR Runtime',
  static_qr: 'Static QR',
};

const QR_TYPE_COLORS: Record<QSealQRType, string> = {
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

export function QSealDetailDialog({ open, onOpenChange, product }: QSealDetailDialogProps) {
  if (!product) return null;

  const activationPct =
    product.total_qr_codes > 0
      ? Math.round((product.activated_count / product.total_qr_codes) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{product.product_name}</p>
              <p className="text-xs text-muted-foreground font-mono font-normal">
                {product.product_code}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={STATUS_COLORS[product.status]}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
            <Badge variant="secondary" className={QR_TYPE_COLORS[product.qr_type]}>
              {QR_TYPE_LABELS[product.qr_type]}
            </Badge>
            {product.category && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {product.category}
              </Badge>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <Separator />

          {/* QR Metrics */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              QR Metrics
            </p>
            <div className="divide-y">
              <MetricRow label="Total Blocks" value={product.total_blocks} />
              <MetricRow label="Total QR Codes" value={product.total_qr_codes.toLocaleString()} />
              <MetricRow
                label="Activated"
                value={`${product.activated_count.toLocaleString()} (${activationPct}%)`}
              />
              <MetricRow label="Total Scans" value={product.scan_count.toLocaleString()} />
            </div>
          </div>

          <Separator />

          {/* Activation progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Boxes className="h-3 w-3" /> Activation Rate
              </span>
              <span>{activationPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${activationPct}%` }}
              />
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="divide-y">
            <MetricRow
              label="Created"
              value={formatDate(product.created_at, 'DD-MMM-YY')}
            />
            <MetricRow
              label="Last Updated"
              value={formatDate(product.updated_at, 'DD-MMM-YY')}
            />
            {product.created_by && (
              <MetricRow label="Created By" value={product.created_by} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
