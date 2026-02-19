import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../../utility/api/accounts';
import type { Account, AccountListItem } from '../../types/account.types';
import { AuditTrail } from './AuditTrail';
import { BalanceHistory } from './BalanceHistory';
import { ACCOUNT_TYPE_COLORS } from '../../utils/accountColors';

interface AccountDetailDialogProps {
  open: boolean;
  onClose: () => void;
  account: AccountListItem | null;
}

export const AccountDetailDialog: React.FC<AccountDetailDialogProps> = ({
  open,
  onClose,
  account: accountListItem,
}) => {
  const { accessToken } = useUserStore();
  const [tabValue, setTabValue] = useState('balance-history');
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!open || !accountListItem || !accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await accountApi.get(accessToken, accountListItem.id) as Account;
        setAccount(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [open, accountListItem, accessToken]);

  if (!accountListItem) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{accountListItem.account_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{accountListItem.account_code}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading account details...</div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && account && (
          <>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <Badge variant="secondary" className={ACCOUNT_TYPE_COLORS[account.account_type]}>
                  {account.account_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className={account.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-sm font-medium">{account.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-sm font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: account.currency,
                  }).format(account.current_balance || 0)}
                </p>
              </div>
              {account.parent && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Parent Account</p>
                  <p className="text-sm font-medium">{account.parent.account_code} - {account.parent.account_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{new Date(account.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{new Date(account.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
              <TabsList>
                <TabsTrigger value="balance-history">Balance History</TabsTrigger>
                <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
              </TabsList>

              <TabsContent value="balance-history" className="mt-4">
                <BalanceHistory
                  accountId={account.id}
                  accountCode={account.account_code}
                  accountName={account.account_name}
                  currency={account.currency}
                />
              </TabsContent>

              <TabsContent value="audit-trail" className="mt-4">
                <AuditTrail accountId={account.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
