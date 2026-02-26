import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Loader2, AlertCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Label,
} from '@horizon-sync/ui/components';

import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../../utility/api/accounts';
import { AccountSelector } from './AccountSelector';
import type { AccountType } from '../../types/account.types';

/** Payment-related default account types shown in the UI (modern ERP style) */
const DEFAULT_ACCOUNT_TYPES: Array<{
  transaction_type: string;
  label: string;
  description: string;
  accountType: AccountType;
}> = [
  {
    transaction_type: 'accounts_receivable',
    label: 'Accounts Receivable',
    description: 'Used when confirming customer payments (receivables side of journal)',
    accountType: 'ASSET',
  },
  {
    transaction_type: 'cash',
    label: 'Cash',
    description: 'Default account for payments received in cash',
    accountType: 'ASSET',
  },
  {
    transaction_type: 'bank',
    label: 'Bank',
    description: 'Default account for bank transfer payments',
    accountType: 'ASSET',
  },
  {
    transaction_type: 'checks_received',
    label: 'Checks Received',
    description: 'Default account for check payments',
    accountType: 'ASSET',
  },
  {
    transaction_type: 'accounts_payable',
    label: 'Accounts Payable',
    description: 'Used when confirming supplier payments (payables side of journal)',
    accountType: 'LIABILITY',
  },
];

export function SystemConfiguration() {
  const { accessToken } = useUserStore();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDefaults = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError(null);
    try {
      const list = await accountApi.getDefaultAccounts(accessToken);
      const next: Record<string, string> = {};
      for (const m of list) {
        next[m.transaction_type] = m.account_id;
      }
      setMappings(next);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load default accounts');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  const handleAccountChange = (transactionType: string, accountId: string) => {
    setMappings((prev) => ({ ...prev, [transactionType]: accountId }));
    setSaveResult(null);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const defaults = DEFAULT_ACCOUNT_TYPES.filter((t) => mappings[t.transaction_type]).map(
        (t) => ({
          transaction_type: t.transaction_type,
          account_id: mappings[t.transaction_type],
        })
      );
      if (defaults.length === 0) {
        setSaveResult({ success: 0, errors: ['Select at least one default account to save.'] });
        return;
      }
      const res = await accountApi.updateDefaultAccounts(accessToken, defaults);
      const errors = (res.errors || []).map(
        (e: { error?: string; transaction_type?: string }) =>
          `${e.transaction_type ?? 'Item'}: ${e.error ?? 'Unknown error'}`
      );
      setSaveResult({
        success: res.success_count ?? 0,
        errors,
      });
      if (errors.length === 0) {
        await loadDefaults();
      }
    } catch (e) {
      setSaveResult({
        success: 0,
        errors: [e instanceof Error ? e.message : 'Failed to save default accounts'],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Configuration
        </CardTitle>
        <CardDescription>Chart of accounts and default account settings for payments and journal posting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Default Accounts (for payment confirmation and journal entries) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Default Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Set which ledger accounts are used for payments and journal entries. Required to confirm customer or supplier payments.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save defaults
                </>
              )}
            </Button>
          </div>

          {loadError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Error loading defaults</p>
                <p className="text-sm text-destructive mt-1">{loadError}</p>
              </div>
            </div>
          )}

          {saveResult && (
            <div
              className={
                saveResult.errors.length > 0
                  ? 'rounded-lg border border-destructive bg-destructive/10 p-4 flex gap-2'
                  : 'rounded-lg border border-border bg-muted/50 p-4 flex gap-2'
              }
            >
              <AlertCircle
                className={
                  'h-4 w-4 shrink-0 ' +
                  (saveResult.errors.length > 0 ? 'text-destructive' : 'text-foreground')
                }
              />
              <div>
                <p
                  className={
                    'text-sm font-medium ' +
                    (saveResult.errors.length > 0 ? 'text-destructive' : 'text-foreground')
                  }
                >
                  {saveResult.errors.length > 0
                    ? 'Some defaults could not be saved'
                    : 'Defaults saved'}
                </p>
                <div className="text-sm mt-1 text-muted-foreground">
                  {saveResult.errors.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {saveResult.errors.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  ) : (
                    `${saveResult.success} default account(s) updated.`
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading default accounts...
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-6">
              {DEFAULT_ACCOUNT_TYPES.map((t) => (
                <div key={t.transaction_type} className="grid gap-2">
                  <Label className="text-base font-medium">{t.label}</Label>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="max-w-md">
                    <AccountSelector
                      value={mappings[t.transaction_type] ?? ''}
                      onValueChange={(id) => handleAccountChange(t.transaction_type, id)}
                      placeholder={`Select account for ${t.label}`}
                      filterByType={t.accountType}
                      filterByStatus="active"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export default SystemConfiguration;
