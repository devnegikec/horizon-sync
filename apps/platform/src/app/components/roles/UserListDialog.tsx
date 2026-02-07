import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserListDialogProps {
  roleName: string;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
}

export function UserListDialog({ roleName, users, isOpen, onClose }: UserListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Users with {roleName} Role</DialogTitle>
          <DialogDescription>
            {users.length} {users.length === 1 ? 'user has' : 'users have'} this role assigned
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
