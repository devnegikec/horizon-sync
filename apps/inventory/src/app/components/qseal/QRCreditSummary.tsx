import { AlertTriangle, Coins, History } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { useQRCreditLedger } from '../../features/qr-management/hooks/useQRCreditLedger';
import { useQRCredits } from '../../features/qr-management/hooks/useQRCredits';
import type { QRCreditBalance, QRCreditLedgerResponse } from '../../features/qr-management/types/qrCredit.types';
import { formatDate } from '../../utility/formatDate';

function CreditCards({ summary, loading }: { summary: QRCreditBalance | null; loading: boolean }) {
  const values = {
    'Total Credits': summary?.total_credits ?? 0,
    Consumed: summary?.used_credits ?? 0,
    Reserved: summary?.reserved_credits ?? 0,
    Available: summary?.balance_credits ?? 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Object.entries(values).map(([label, value]) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value.toLocaleString()}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreditActivity({ ledger, loading, error }: { ledger: QRCreditLedgerResponse | null; loading: boolean; error: string | null }) {
  let content;
  if (loading) {
    content = (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  } else if (error) {
    content = <p className="text-sm text-destructive">{error}</p>;
  } else if (!ledger?.transactions.length) {
    content = <p className="text-sm text-muted-foreground">No credit activity yet.</p>;
  } else {
    content = (
      <div className="divide-y">
        {ledger.transactions.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-medium">{item.transaction_type === 'credit_addition' ? 'Credits added' : 'QR block generated'}</p>
              <p className="text-xs text-muted-foreground">{item.reason || formatDate(item.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
            </div>
            <div className="text-right">
              <p className={item.amount > 0 ? 'font-medium text-green-600' : 'font-medium text-destructive'}>
                {item.amount > 0 ? '+' : ''}
                {item.amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Balance {item.balance_after.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Recent Credit Activity
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function QRCreditSummary() {
  const { summary, loading, error } = useQRCredits();
  const { data: ledger, loading: ledgerLoading, error: ledgerError } = useQRCreditLedger();
  const lowBalance = summary !== null && summary.balance_credits < 500;

  return (
    <div className="space-y-4">
      <CreditCards summary={summary} loading={loading} />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {lowBalance && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          Credit balance is low. Contact your system administrator to add credits.
        </div>
      )}

      <CreditActivity ledger={ledger} loading={ledgerLoading} error={ledgerError} />
    </div>
  );
}
