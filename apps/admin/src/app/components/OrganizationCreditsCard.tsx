import * as React from 'react';

import { AlertTriangle, Coins, History, Plus } from 'lucide-react';

import { toast } from '@horizon-sync/ui';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import {
  useAddOrganizationCredits,
  useOrganizationCreditLedger,
  useOrganizationCredits,
} from '../hooks/useOrganizationCredits';

// The component intentionally coordinates the balance, ledger, and add-credit states.
// eslint-disable-next-line complexity
export function OrganizationCreditsCard({
  organizationId,
}: {
  organizationId: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const balanceQuery = useOrganizationCredits(organizationId);
  const ledgerQuery = useOrganizationCreditLedger(organizationId);
  const addMutation = useAddOrganizationCredits(organizationId);
  const balance = balanceQuery.data;
  const lowBalance = balance !== undefined && balance.balance_credits < 500;

  const resetForm = () => {
    setAmount('');
    setReason('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount < 1 || parsedAmount > 10_000_000) {
      toast({
        variant: 'destructive',
        title: 'Invalid credit amount',
        description: 'Enter a whole credit amount between 1 and 10,000,000.',
      });
      return;
    }
    if (reason.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Reason required',
        description: 'Enter a reason with at least 3 characters.',
      });
      return;
    }

    try {
      await addMutation.mutateAsync({
        amount: parsedAmount,
        reason: reason.trim(),
        reference_id: crypto.randomUUID(),
      });
      toast({
        title: 'Credits added',
        description: `${parsedAmount.toLocaleString()} credits were added successfully.`,
      });
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add credits',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            QSeal Credits
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Credits are consumed when QR items are generated.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Credits
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {balanceQuery.isError ? (
          <p className="text-sm text-destructive">
            {balanceQuery.error instanceof Error
              ? balanceQuery.error.message
              : 'Failed to load credits.'}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total Credits', balance?.total_credits],
              ['Consumed', balance?.used_credits],
              ['Reserved', balance?.reserved_credits],
              ['Available', balance?.balance_credits],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                {balanceQuery.isLoading
                  ? <Skeleton className="mt-2 h-7 w-24" />
                  : <p className="mt-1 text-2xl font-bold">{Number(value ?? 0).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}

        {lowBalance && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            This Organization has fewer than 500 available credits.
          </div>
        )}

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <History className="h-4 w-4" />
            Recent Credit Activity
          </h3>
          {ledgerQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : ledgerQuery.isError ? (
            <p className="text-sm text-destructive">
              {ledgerQuery.error instanceof Error
                ? ledgerQuery.error.message
                : 'Failed to load credit activity.'}
            </p>
          ) : !ledgerQuery.data?.transactions.length ? (
            <p className="text-sm text-muted-foreground">No credit activity yet.</p>
          ) : (
            <div className="divide-y rounded-md border px-3">
              {ledgerQuery.data.transactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {item.transaction_type === 'credit_addition'
                        ? 'Credits added'
                        : 'QR block generated'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.reason || new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={item.amount > 0 ? 'font-medium text-green-600' : 'font-medium text-destructive'}>
                      {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance {item.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add QSeal Credits</DialogTitle>
            <DialogDescription>
              This adds credits to the Organization and records an immutable audit entry.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="credit-amount">Credit Amount *</Label>
              <Input id="credit-amount"
                type="number"
                min={1}
                max={10_000_000}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credit-reason">Reason *</Label>
              <Input id="credit-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={3}
                maxLength={500}
                placeholder="e.g. Purchased annual QR package"
                required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add Credits'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
