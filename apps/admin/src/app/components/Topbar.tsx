import { Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { Avatar, AvatarFallback } from '@horizon-sync/ui/components/ui/avatar';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { ThemeToggle } from '@horizon-sync/ui/components/theme-toggle';

import { useAdminProfile } from '../hooks/useAdminProfile';

interface AdminTopbarProps {
  onMobileToggle: () => void;
}

function getInitials(profile: { first_name?: string; last_name?: string; email?: string } | null | undefined): string {
  if (!profile) return 'A';
  const first = profile.first_name?.[0] ?? '';
  const last = profile.last_name?.[0] ?? '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return profile.email?.[0]?.toUpperCase() ?? 'A';
}

function getDisplayName(profile: { display_name?: string | null; first_name?: string; last_name?: string } | null | undefined): string {
  if (!profile) return 'Admin';
  if (profile.display_name) return profile.display_name;
  const full = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
  return full || 'Admin';
}

export function AdminTopbar({ onMobileToggle }: AdminTopbarProps) {
  const navigate = useNavigate();
  const clearAuth = useUserStore((state) => state.clearAuth);
  const user = useUserStore((state) => state.user);
  const { data: profile } = useAdminProfile();

  const displayName = getDisplayName(profile);
  const initials = getInitials(profile ?? user);
  const email = profile?.email ?? user?.email ?? '';

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block">
          System Administration
        </h2>
      </div>

      {/* Right Section — User Menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-violet-500/20 transition-all">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3 py-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 overflow-hidden">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                  <p className="text-xs text-violet-500 font-medium">System Admin</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
