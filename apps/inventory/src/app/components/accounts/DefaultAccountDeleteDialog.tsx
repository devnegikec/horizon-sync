import * as React from 'react';

import { AlertTriangle, Shield, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@horizon-sync/ui/components';

import type { DefaultAccountMapping, AccountListItem } from '../../types/account.types';

interface DefaultAccountDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  account: AccountListItem | null;
  defaultAccountUsage: DefaultAccountMapping[];
  isSystemAdmin: boolean;
}

export function DefaultAccountDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  account,
  defaultAccountUsage,
  isSystemAdmin,
}: DefaultAccountDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle>Default Account Protection</DialogTitle>
          </div>
          <DialogDescription className="pt-2 space-y-3">
            <p>
              <strong>{account.account_name}</strong> ({account.account_code}) is configured as a default account for the following transaction types:
            </p>
            
            <div className="space-y-2">
              {defaultAccountUsage.map((usage, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Badge variant="outline" className="text-xs">
                    {usage.transaction_type}
                  </Badge>
                  {usage.scenario && (
                    <Badge variant="secondary" className="text-xs">
                      {usage.scenario}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {isSystemAdmin ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive mb-1">System Admin Warning</p>
                  <p>Deleting this account will remove its default mappings and may affect automated transaction processing. Are you sure you want to proceed?</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Protected Account</p>
                  <p>Default accounts can only be edited, not deleted. This protects critical system functionality.</p>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isSystemAdmin && (
            <Button variant="destructive" onClick={handleConfirm}>
              Delete Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}