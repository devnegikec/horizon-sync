import { useState } from 'react';

import { AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@horizon-sync/ui/components';

import type { Role } from '../../types/role.types';

interface DeleteRoleDialogProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteRoleDialog({ role, isOpen, onClose, onConfirm }: DeleteRoleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Role</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              Are you sure you want to delete the role <strong className="text-foreground">{role.name}</strong>?
            </p>
            {role.user_count !== undefined && role.user_count > 0 && (
              <p className="text-destructive font-medium">
                Warning: This role is currently assigned to {role.user_count} user{role.user_count === 1 ? '' : 's'}.
                Deleting it will remove these permissions from those users.
              </p>
            )}
            <p className="text-sm">This action cannot be undone.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
