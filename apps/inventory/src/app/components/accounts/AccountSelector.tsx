import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from '@horizon-sync/ui/components';

import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../../utility/api/accounts';
import type { AccountListItem, AccountType } from '../../types/account.types';

export interface AccountSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  filterByType?: AccountType | AccountType[];
  filterByStatus?: 'active' | 'inactive' | 'all';
  excludeParentAccounts?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Reusable account selector component with search and filtering
 * 
 * @example
 * ```tsx
 * <AccountSelector
 *   value={accountId}
 *   onValueChange={setAccountId}
 *   label="Select Account"
 *   filterByType="ASSET"
 *   excludeParentAccounts={true}
 * />
 * ```
 */
export function AccountSelector({
  value,
  onValueChange,
  label = 'Account',
  placeholder = 'Select account',
  filterByType,
  filterByStatus = 'active',
  excludeParentAccounts = false,
  disabled = false,
  required = false,
  error,
}: AccountSelectorProps) {
  const { accessToken } = useUserStore();
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [accessToken, filterByType, filterByStatus]);

  const loadAccounts = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const filters: Record<string, string> = {};

      if (filterByStatus !== 'all') {
        filters.status = filterByStatus;
      }

      if (filterByType) {
        if (Array.isArray(filterByType)) {
          // For multiple types, we'll filter client-side
        } else {
          filters.account_type = filterByType;
        }
      }

      const response = await accountApi.list(accessToken, 1, 1000, filters);
      let accountsList = response.chart_of_accounts || [];

      // Client-side filtering for multiple types
      if (Array.isArray(filterByType) && filterByType.length > 0) {
        accountsList = accountsList.filter(acc =>
          filterByType.includes(acc.account_type)
        );
      }

      // Filter out parent accounts if requested
      if (excludeParentAccounts) {
        accountsList = accountsList.filter(acc => acc.is_group === false);
      }

      setAccounts(accountsList);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts;

    const term = searchTerm.toLowerCase();
    return accounts.filter(
      acc =>
        acc.account_code.toLowerCase().includes(term) ||
        acc.account_name.toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const selectedAccount = accounts.find(acc => acc.id === value);

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={loading ? 'Loading...' : placeholder}>
            {selectedAccount && (
              <span>
                {selectedAccount.account_code} - {selectedAccount.account_name}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No accounts found
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {account.account_code} - {account.account_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {account.account_type} • {account.currency}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
