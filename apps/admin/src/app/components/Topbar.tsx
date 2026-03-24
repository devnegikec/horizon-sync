import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';

import { useAdminProfile } from '../hooks/useAdminProfile';

interface AdminTopbarProps {
  onMobileToggle: () => void;
}

function resolveDisplayName(profile: {
  display_name?: string | null;
  first_name?: string;
  last_name?: string;
} | null | undefined): string {
  if (!profile) return 'Admin';
  if (profile.display_name) return profile.display_name;
  const first = profile.first_name ?? '';
  const last = profile.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Admin';
}

export function AdminTopbar({ onMobileToggle }: AdminTopbarProps) {
  const navigate = useNavigate();
  const clearAuth = useUserStore((state) => state.clearAuth);
  const { data: profile } = useAdminProfile();

  const displayName = resolveDisplayName(profile);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {displayName}
        </span>
        <Button variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
