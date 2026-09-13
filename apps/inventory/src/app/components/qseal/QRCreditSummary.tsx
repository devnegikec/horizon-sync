import * as React from 'react';

import { AlertTriangle, Coins, History, Plus } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

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
  const { summary, loading, error, addCredits, refetch } = useQRCredits();
  const { data: ledger, loading: ledgerLoading, error: ledgerError, refetch: refetchLedger } = useQRCreditLedger();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const userType = useUserStore((state) => state.user?.user_type);
  const canAddCredits = userType === 'system_admin';
  const lowBalance = summary !== null && summary.balance_credits < 500;

  const resetForm = () => {
    setAmount('');
    setReason('');
    setSaveError(null);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !saving) resetForm();
  };

  const handleAddCredits = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!summary || !Number.isInteger(parsedAmount) || parsedAmount < 1 || parsedAmount > 10_000_000) {
      setSaveError('Enter a whole number between 1 and 10,000,000.');
      return;
    }
    if (reason.trim().length < 3) {
      setSaveError('Provide a reason with at least 3 characters.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await addCredits(summary.organization_id, { amount: parsedAmount, reason: reason.trim() });
      setDialogOpen(false);
      resetForm();
      await refetch();
      await refetchLedger();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add QR credits.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {canAddCredits && (
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)} disabled={!summary}>
            <Plus className="mr-2 h-4 w-4" />
            Add QR Credits
          </Button>
        </div>
      )}
      <CreditCards summary={summary} loading={loading} />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {lowBalance && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          Credit balance is low.{' '}
          {canAddCredits ? 'Add credits to continue generating QR blocks.' : 'Contact your system administrator to add credits.'}
        </div>
      )}

      <CreditActivity ledger={ledger} loading={ledgerLoading} error={ledgerError} />

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add QR Credits</DialogTitle>
            <DialogDescription>Add credits to this organization’s balance for QR block generation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCredits} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-credit-amount">Credit amount</Label>
              <Input id="qr-credit-amount"
                type="number"
                min={1}
                max={10_000_000}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 1000"
                disabled={saving}
                required/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-credit-reason">Reason</Label>
              <Textarea id="qr-credit-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Initial QR credit allocation"
                maxLength={500}
                disabled={saving}
                required/>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !summary}>
                {saving ? 'Adding…' : 'Add Credits'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
