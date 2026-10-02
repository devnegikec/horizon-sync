import type { QSealCreditInfo } from '../../../types/qseal.types';

interface QSealHeaderProps {
  creditInfo?: QSealCreditInfo;
}

/**
 * Page title block plus the QR-credit summary. The per-view actions
 * (Refresh / New Product) live with the view that owns them — e.g.
 * `ProductsManagement` renders the Products actions in its own section heading.
 */
export function QSealHeader({ creditInfo }: QSealHeaderProps) {
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
        <h1 className="text-3xl font-bold tracking-tight">QSeal Management</h1>
        <p className="text-muted-foreground mt-1">Manage QR-enabled products, blocks, and activation tracking</p>
      </div>

      {creditInfo && (
        <div className="hidden md:flex flex-col items-end text-sm">
          <span className="text-muted-foreground">Monthly QR Credits</span>
          <span className={`font-semibold ${creditColor}`}>
            {creditInfo.remaining.toLocaleString()} / {creditInfo.monthly_quota.toLocaleString()} remaining
          </span>
        </div>
      )}
    </div>
  );
}
