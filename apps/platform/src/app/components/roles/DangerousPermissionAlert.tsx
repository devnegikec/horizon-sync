import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

import { Card, CardContent, Button, Checkbox, Label } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { getWildcardType } from './utils/wildcard';

interface DangerousPermissionAlertProps {
  selectedPermissions: Set<string>;
  onConfirm?: (confirmed: boolean) => void;
  onDismiss?: () => void;
}

export function DangerousPermissionAlert({ selectedPermissions, onConfirm, onDismiss }: DangerousPermissionAlertProps) {
  const hasFullAccess = selectedPermissions.has('*.*');
  const moduleWildcards = Array.from(selectedPermissions).filter(
    (perm) => getWildcardType(perm) === 'module'
  );

  // Don't show alert if no dangerous permissions
  if (!hasFullAccess && moduleWildcards.length === 0) {
    return null;
  }

  // Critical alert for *.*
  if (hasFullAccess) {
    return (
      <Card className="border-2 border-destructive bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-3">
              <h4 className="text-lg font-semibold text-destructive">Critical: Full System Access</h4>
              <div className="space-y-3 text-sm">
                <p>
                  The <code className="px-1.5 py-0.5 bg-destructive/20 rounded text-sm font-mono">*.*</code> permission
                  grants <strong>unrestricted access to all system resources</strong> across all modules.
                </p>
                <p>
                  Users with this role will be able to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Create, read, update, and delete any data</li>
                  <li>Manage users, roles, and permissions</li>
                  <li>Access all modules and features</li>
                  <li>Perform administrative actions</li>
                </ul>
                <div className="flex items-start gap-2 pt-2 border-t border-destructive/20">
                  <Checkbox id="confirm-full-access" onCheckedChange={(checked) => onConfirm?.(checked === true)} className="mt-0.5" />
                  <Label htmlFor="confirm-full-access" className="text-sm font-medium cursor-pointer">
                    I understand the security implications and want to grant full system access
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // High alert for module wildcards
  if (moduleWildcards.length > 0) {
    return (
      <Card className={cn('border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3 flex-1">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  Module-Level Access Warning
                </h4>
                <div className="text-amber-800 dark:text-amber-200 space-y-2 text-sm">
                  <p>
                    You&apos;ve selected module wildcard permissions that grant broad access:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moduleWildcards.map((perm) => (
                      <code key={perm} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 rounded text-sm font-mono border border-amber-300 dark:border-amber-700">
                        {perm}
                      </code>
                    ))}
                  </div>
                  <p>
                    These permissions grant full access to all actions within the specified module(s).
                    Consider granting specific permissions instead if users don&apos;t need complete module access.
                  </p>
                </div>
              </div>
            </div>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
