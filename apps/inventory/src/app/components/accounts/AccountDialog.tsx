import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
import { useToast } from '@horizon-sync/ui/hooks';

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
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'INR', label: 'INR - Indian Rupee' },
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
  const { toast } = useToast();

  // Fetch accounts for parent selection (API max page size is 100)
  const { accounts: allAccounts, loading: accountsLoading } = useAccounts(1, 100);

  const [formData, setFormData] = useState<CreateAccountPayload>({
    account_code: '',
    account_name: '',
    account_type: 'ASSET',
    parent_account_id: null,
    currency: 'USD',
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
        const searchLower = parentSearchTerm.toString().toLowerCase();
        const matchesCode = a.account_code?.toString().toLowerCase().includes(searchLower);
        const matchesName = a.account_name?.toString().toLowerCase().includes(searchLower);
        return matchesCode || matchesName;
      }

      return true;
    });
  }, [allAccounts, account, formData.account_type, parentSearchTerm]);

  // Get current parent account info for display
  const currentParentAccount = useMemo(() => {
    if (!formData.parent_account_id) return null;
    return allAccounts.find(a => a.id === formData.parent_account_id);
  }, [formData.parent_account_id, allAccounts]);

  useEffect(() => {
    if (open) {
      if (account) {
        setFormData({
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          parent_account_id: account.parent_account_id,
          currency: (account as any).currency || 'USD',
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
          currency: 'USD',
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
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: 'destructive',
      });
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
        toast({
          title: 'Success',
          description: `Account "${formData.account_name}" has been updated successfully.`,
          variant: 'default',
        });
        onUpdated?.();
      } else {
        await createAccount(formData);
        toast({
          title: 'Success',
          description: `Account "${formData.account_name}" has been created successfully.`,
          variant: 'default',
        });
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      // Error is handled by the hook and displayed in the form
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{isEditing ? 'Edit Account' : 'Create New Account'}</DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Update the account details below.'
              : 'Fill in the details to create a new account in your chart of accounts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4 py-4">
            {/* Account Code */}
            <div className="space-y-2">
              <Label htmlFor="account_code" className="text-sm">
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
                <p className="text-xs sm:text-sm text-destructive">{validationErrors.account_code}</p>
              )}
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="account_name" className="text-sm">
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
                <p className="text-xs sm:text-sm text-destructive">{validationErrors.account_name}</p>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="account_type" className="text-sm">
                Account Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value as AccountType })}
                disabled={isEditing}
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
              {isEditing && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Account type cannot be changed after creation
                </p>
              )}
              {validationErrors.account_type && (
                <p className="text-xs sm:text-sm text-destructive">{validationErrors.account_type}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm">
                Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Account */}
            <div className="space-y-2">
              <Label htmlFor="parent_account" className="text-sm">Parent Account (Optional)</Label>
              <div className="space-y-2">
                {/* Search input for filtering */}
                <Input
                  placeholder="Search parent accounts..."
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  disabled={accountsLoading}
                  className="text-sm"
                />

                {/* Parent account dropdown */}
                <Select
                  value={formData.parent_account_id || 'none'}
                  onValueChange={handleParentChange}
                  disabled={accountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent account">
                      {formData.parent_account_id && currentParentAccount ? (
                        `${currentParentAccount.account_code} - ${currentParentAccount.account_name}`
                      ) : (
                        "No parent account"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] sm:max-h-[300px]">
                    <SelectItem value="none">No parent account</SelectItem>
                    
                    {/* Show current parent account if not in eligible list (for editing) */}
                    {formData.parent_account_id && currentParentAccount && 
                     !eligibleParentAccounts.find(a => a.id === currentParentAccount.id) && (
                      <SelectItem key={currentParentAccount.id} value={currentParentAccount.id}>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs sm:text-sm">
                            {currentParentAccount.account_code} - {currentParentAccount.account_name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            (Current) {buildAccountPath(currentParentAccount, allAccounts)}
                          </span>
                        </div>
                      </SelectItem>
                    )}
                    
                    {eligibleParentAccounts.length === 0 && parentSearchTerm && (
                      <div className="px-2 py-1.5 text-xs sm:text-sm text-muted-foreground">
                        No matching accounts found
                      </div>
                    )}
                    {eligibleParentAccounts.map((parentAccount) => (
                      <SelectItem key={parentAccount.id} value={parentAccount.id}>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs sm:text-sm">
                            {parentAccount.account_code} - {parentAccount.account_name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
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
                <div className="mt-2 p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md flex gap-2">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5"
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
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    This account will become a non-posting account (group account) and cannot receive direct transactions.
                  </p>
                </div>
              )}
            </div>

            {/* Opening Balance (only for new accounts) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="opening_balance" className="text-sm">Opening Balance</Label>
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
              <Label htmlFor="is_active" className="text-sm">Status</Label>
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
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">Failed to save account</p>
                  <p className="text-sm text-destructive mt-1">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {error.includes('duplicate') || error.includes('already exists') 
                      ? 'Try using a different account code.' 
                      : error.includes('network') || error.includes('connection')
                      ? 'Please check your internet connection and try again.'
                      : 'Please review your input and try again. If the problem persists, contact support.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || accountsLoading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Update Account
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
