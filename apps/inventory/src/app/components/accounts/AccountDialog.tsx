import * as React from 'react';
import { useState, useEffect } from 'react';

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
  Textarea,
} from '@horizon-sync/ui/components';

import { useAccountActions } from '../../hooks/useAccountActions';
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

export function AccountDialog({ open, onOpenChange, account, onCreated, onUpdated }: AccountDialogProps) {
  const isEditing = !!account;
  const { createAccount, updateAccount, loading, error } = useAccountActions();

  const [formData, setFormData] = useState<CreateAccountPayload>({
    account_code: '',
    account_name: '',
    account_type: 'ASSET',
    opening_balance: 0,
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (account) {
        setFormData({
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          opening_balance: 0,
          is_active: account.is_active,
        });
      } else {
        setFormData({
          account_code: '',
          account_name: '',
          account_type: 'ASSET',
          opening_balance: 0,
          is_active: true,
        });
      }
      setValidationErrors({});
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
