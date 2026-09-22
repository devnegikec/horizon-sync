import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import type { QSealCreditInfo } from '../../types/qseal.types';

interface QSealHeaderProps {
  onRefresh: () => void;
  onCreateProduct: () => void;
  isLoading?: boolean;
  creditInfo?: QSealCreditInfo;
}

export function QSealHeader({ onRefresh, onCreateProduct, isLoading = false, creditInfo }: QSealHeaderProps) {
  const creditPct = creditInfo ? Math.round((creditInfo.used_this_month / creditInfo.monthly_quota) * 100) : null;

  const creditColor =
    creditPct === null
      ? ''
      : creditPct >= 90
        ? 'text-red-600 dark:text-red-400'
        : creditPct >= 70
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QSeal Products</h1>
        <p className="text-muted-foreground mt-1">Manage QR-enabled products, blocks, and activation tracking</p>
      </div>

      <div className="flex items-center gap-3">
        {creditInfo && (
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="text-muted-foreground">Monthly QR Credits</span>
            <span className={`font-semibold ${creditColor}`}>
              {creditInfo.remaining.toLocaleString()} / {creditInfo.monthly_quota.toLocaleString()} remaining
            </span>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="default" onClick={onCreateProduct} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </div>
    </div>
  );
}
