import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';

import { useAccountActions } from '../../hooks/useAccountActions';
import { useAccounts } from '../../hooks/useAccounts';
import type { AccountListItem, AccountType, CreateAccountPayload } from '../../types/account.types';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountListItem | null;
  onCreated?: () => void;
  onUpdated?: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

/**
 * Build account hierarchy path for display
 */
function buildAccountPath(account: AccountListItem, allAccounts: AccountListItem[]): string {
  const path: string[] = [account.account_name];
  let currentAccount = account;

  // Traverse up the hierarchy
  while (currentAccount.parent_account_id) {
    const parent = allAccounts.find(a => a.id === currentAccount.parent_account_id);
    if (!parent) break;
    path.unshift(parent.account_name);
    currentAccount = parent;
  }

  return path.join(' > ');
}

/**
 * Check if selecting a parent would create a circular reference
 */
function wouldCreateCircularReference(
  accountId: string | undefined,
  parentId: string,
  allAccounts: AccountListItem[]
): boolean {
  if (!accountId) return false;
  if (accountId === parentId) return true;

  // Check if the parent is a descendant of the current account
  let currentParent = allAccounts.find(a => a.id === parentId);
  const visited = new Set<string>();

  while (currentParent?.parent_account_id) {
    if (visited.has(currentParent.id)) break; // Prevent infinite loop
    visited.add(currentParent.id);

    if (currentParent.parent_account_id === accountId) {
      return true;
    }
    currentParent = allAccounts.find(a => a.id === currentParent!.parent_account_id);
  }

  return false;
}

export function AccountDialog({ open, onOpenChange, account, onCreated, onUpdated }: AccountDialogProps) {
  const isEditing = !!account;
  const { createAccount, updateAccount, loading, error } = useAccountActions();
  
  // Fetch all accounts for parent selection (with a large page size to get all)
  const { accounts: allAccounts, loading: accountsLoading } = useAccounts(1, 1000);

  const [formData, setFormData] = useState<CreateAccountPayload>({
    account_code: '',
    account_name: '',
    account_type: 'ASSET',
    parent_account_id: null,
    opening_balance: 0,
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [showParentWarning, setShowParentWarning] = useState(false);

  // Filter eligible parent accounts
  const eligibleParentAccounts = useMemo(() => {
    return allAccounts.filter(a => {
      // Can't select self as parent
      if (account && a.id === account.id) return false;
      
      // Must be same account type
      if (a.account_type !== formData.account_type) return false;
      
      // Must be active
      if (!a.is_active) return false;
      
      // Check for circular reference
      if (wouldCreateCircularReference(account?.id, a.id, allAccounts)) return false;
      
      // Filter by search term
      if (parentSearchTerm) {
        const searchLower = parentSearchTerm.toLowerCase();
        const matchesCode = a.account_code.toLowerCase().includes(searchLower);
        const matchesName = a.account_name.toLowerCase().includes(searchLower);
        return matchesCode || matchesName;
      }
      
      return true;
    });
  }, [allAccounts, account, formData.account_type, parentSearchTerm]);

  useEffect(() => {
    if (open) {
      if (account) {
        setFormData({
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          parent_account_id: account.parent_account_id,
          opening_balance: 0,
          is_active: account.is_active,
        });
        setShowParentWarning(!!account.parent_account_id);
      } else {
        setFormData({
          account_code: '',
          account_name: '',
          account_type: 'ASSET',
          parent_account_id: null,
          opening_balance: 0,
          is_active: true,
        });
        setShowParentWarning(false);
      }
      setValidationErrors({});
      setParentSearchTerm('');
    }
  }, [open, account]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.account_code.trim()) {
      errors.account_code = 'Account code is required';
    } else if (formData.account_code.length > 50) {
      errors.account_code = 'Account code must not exceed 50 characters';
    }

    if (!formData.account_name.trim()) {
      errors.account_name = 'Account name is required';
    } else if (formData.account_name.length > 200) {
      errors.account_name = 'Account name must not exceed 200 characters';
    }

    if (!formData.account_type) {
      errors.account_type = 'Account type is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && account) {
        await updateAccount(account.id, {
          account_name: formData.account_name,
          account_type: formData.account_type,
          parent_account_id: formData.parent_account_id,
          is_active: formData.is_active,
        });
        onUpdated?.();
      } else {
        await createAccount(formData);
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to save account:', err);
    }
  };

  const handleParentChange = (value: string) => {
    const parentId = value === 'none' ? null : value;
    setFormData({ ...formData, parent_account_id: parentId });
    setShowParentWarning(!!parentId);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Create New Account'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the account details below.'
              : 'Fill in the details to create a new account in your chart of accounts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Account Code */}
            <div className="space-y-2">
              <Label htmlFor="account_code">
                Account Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="e.g., 1000-01"
                disabled={isEditing}
                className={validationErrors.account_code ? 'border-destructive' : ''}
              />
              {validationErrors.account_code && (
                <p className="text-sm text-destructive">{validationErrors.account_code}</p>
              )}
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="account_name">
                Account Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g., Cash in Bank"
                className={validationErrors.account_name ? 'border-destructive' : ''}
              />
              {validationErrors.account_name && (
                <p className="text-sm text-destructive">{validationErrors.account_name}</p>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="account_type">
                Account Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value as AccountType })}
              >
                <SelectTrigger className={validationErrors.account_type ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.account_type && (
                <p className="text-sm text-destructive">{validationErrors.account_type}</p>
              )}
            </div>

            {/* Parent Account */}
            <div className="space-y-2">
              <Label htmlFor="parent_account">Parent Account (Optional)</Label>
              <div className="space-y-2">
                {/* Search input for filtering */}
                <Input
                  placeholder="Search parent accounts..."
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  disabled={accountsLoading}
                />
                
                {/* Parent account dropdown */}
                <Select
                  value={formData.parent_account_id || 'none'}
                  onValueChange={handleParentChange}
                  disabled={accountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent account" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">No parent account</SelectItem>
                    {eligibleParentAccounts.length === 0 && parentSearchTerm && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No matching accounts found
                      </div>
                    )}
                    {eligibleParentAccounts.map((parentAccount) => (
                      <SelectItem key={parentAccount.id} value={parentAccount.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {parentAccount.account_code} - {parentAccount.account_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {buildAccountPath(parentAccount, allAccounts)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Warning when parent is selected */}
              {showParentWarning && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                  <svg
                    className="h-5 w-5 text-amber-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm text-amber-800">
                    This account will become a non-posting account (group account) and cannot receive direct transactions.
                  </p>
                </div>
              )}
            </div>

            {/* Opening Balance (only for new accounts) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
