import * as React from 'react';

import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Users,
  FileText,
  HelpCircle,
  Zap,
  CreditCard,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';
import { cn } from '@horizon-sync/ui/lib';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Inventory', href: '/inventory', icon: Package },
  { title: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Reports', href: '/reports', icon: FileText },
];

const bottomNavItems: NavItem[] = [
  { title: 'Settings', href: '/settings', icon: Settings },
  { title: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  open?: boolean;
  collapsed?: boolean;
  isMobile?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function Sidebar({
  open = true,
  collapsed = false,
  isMobile = false,
  onToggle,
  onClose,
}: SidebarProps) {
  const location = useLocation();

  const handleLinkClick = () => {
    // Close sidebar on mobile when navigating
    if (isMobile) {
      onClose?.();
    }
  };

  return (
    <aside className={cn(
        'flex flex-col h-full border-r border-border bg-card transition-all duration-300 ease-in-out',
        // Desktop behavior
        !isMobile && (collapsed ? 'w-[70px]' : 'w-[260px]'),
        // Mobile behavior - fixed positioning with slide animation
        isMobile && [
          'fixed inset-y-0 left-0 z-50 w-[260px]',
          open ? 'translate-x-0' : '-translate-x-full',
        ],
      )}>
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Horizon
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-0.5">
              Sync Platform
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive =
            item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && !isMobile && 'justify-center px-2',
                  )}>
                  <item.icon className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}/>
                  {(!collapsed || isMobile) && <span>{item.title}</span>}
                  {isActive && (!collapsed || isMobile) && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* Bottom Navigation */}
      <div className="py-4 px-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && !isMobile && 'justify-center px-2',
                  )}>
                  <item.icon className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}/>
                  {(!collapsed || isMobile) && <span>{item.title}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && !isMobile && (
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}
