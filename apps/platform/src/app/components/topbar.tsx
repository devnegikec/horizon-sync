import * as React from 'react';

import { Search, Bell, Menu, PanelLeftClose, PanelLeft, LogOut } from 'lucide-react';
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

import { useAuth } from '../hooks';

interface TopbarProps {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ sidebarCollapsed, sidebarOpen, isMobile, onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar fallback
  const userInitials = user?.email
    ? user.email
        .split('@')[0]
        .split('.')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 gap-4">
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
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground transition-colors focus-within:bg-muted">
          <Search className="h-4 w-4" />
          <input type="text"
            placeholder="Search anything..."
            className="bg-transparent text-sm outline-none w-[200px] lg:w-[300px] placeholder:text-muted-foreground"/>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-card" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-violet-500/20 transition-all">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
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
