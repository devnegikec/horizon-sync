import * as React from 'react';

import { Search, Menu, PanelLeftClose, PanelLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ThemeToggle } from '@horizon-sync/ui/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

import { GlobalSearch } from '../features/search/components/GlobalSearch';
import { useKeyboardShortcut } from '../features/search/hooks/useKeyboardShortcut';
import { useAuth } from '../hooks';
import { useOrganizationBranding } from '../hooks/useOrganizationBranding';

import { NotificationBell } from './notifications/NotificationBell';

interface TopbarProps {
  sidebarCollapsed: boolean;
  // sidebarOpen: boolean;
  // isMobile: boolean;
  onToggleSidebar: () => void;
}

/** Organization logo shown at the far right of the topbar, after the user profile. */
function OrganizationLogoBadge({ logoUrl, name }: { logoUrl: string; name: string }) {
  if (!logoUrl) return null;

  return (
    <div className="ml-1 flex items-center gap-2 border-l border-border pl-2">
      <img src={logoUrl}
        alt={name ? `${name} logo` : 'Organization logo'}
        title={name || 'Organization logo'}
        className="h-9 w-9 rounded-md border border-border bg-white object-contain p-0.5" />
      {name && (
        <span className="hidden max-w-[160px] truncate text-sm font-semibold text-foreground xl:inline">{name}</span>
      )}
    </div>
  );
}

interface UserMenuProps {
  user: { email?: string; display_name?: string; avatar_url?: string | null } | null;
  onOpenProfile: () => void;
  onLogout: () => void;
}

/** Avatar dropdown for the signed-in user. */
function UserMenu({ user, onOpenProfile, onLogout }: UserMenuProps) {
  const email = user?.email ?? '';
  const initials = email
    ? email.split('@')[0].split('.').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-violet-500/20 transition-all">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar_url || ''} alt={user?.display_name || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{email ? email.split('@')[0] : 'User'}</p>
            <p className="text-xs text-muted-foreground">{email || 'user@example.com'}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenProfile}>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Team</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { name: organizationName, logoUrl: organizationLogoUrl } = useOrganizationBranding();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Register keyboard shortcut for opening search (Ctrl+K or Cmd+K)
  useKeyboardShortcut('k', { ctrl: true, meta: true }, () => {
    setIsSearchOpen(true);
  });

  // Handle navigation from search results
  const handleNavigate = (entityType: string, entityId: string) => {
    console.log('[Topbar] Navigating to:', { entityType, entityId });

    // Map entity types to the list page that owns the entity — detail pages do
    // not exist yet, so results land on the tab that contains them.
    const routeMap: Record<string, string> = {
      items: '/inventory',
      stock_entries: '/inventory',
      warehouses: '/inventory',
      customers: '/revenue',
      invoices: '/revenue',
      suppliers: '/sourcing',
    };

    const route = routeMap[entityType] || `/${entityType}`;

    // TODO: Once detail pages are implemented, use: `${route}/${entityId}`
    // For now, just navigate to the list page
    console.log('[Topbar] Navigating to route:', route);
    navigate(route);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Desktop Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hidden md:flex">
              {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
        </Tooltip>

        {/* Mobile Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <button onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          aria-label="Open search">
          <Search className="h-4 w-4" />
          <span className="text-sm w-[200px] lg:w-[300px] text-left">Search anything...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <NotificationBell />

        <UserMenu user={user}
          onOpenProfile={() => navigate('/profile')}
          onLogout={handleLogout} />

        {/* Organization logo — right of the user profile */}
        <OrganizationLogoBadge logoUrl={organizationLogoUrl} name={organizationName} />
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}/>
    </header>
  );
}
