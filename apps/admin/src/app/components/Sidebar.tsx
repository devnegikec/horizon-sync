import * as React from 'react';

import {
  LayoutDashboard,
  Building2,
  Users,
  HardHat,
  Settings,
  HelpCircle,
  Zap,
  FileText,
  CreditCard,
  Bell,
  Shield,
  Ban,
  UserCog,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Separator } from '@horizon-sync/ui/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@horizon-sync/ui/components/ui/tooltip';
import { cn } from '@horizon-sync/ui/lib';
import { CurrencyIcon } from '@horizon-sync/ui';
import { useCurrencyStore } from '@horizon-sync/store';

import { usePermissions } from '../hooks/usePermissions';

/** Wrapper that reads baseCurrency from the store and passes it to CurrencyIcon */
function DynamicCurrencyIcon({ className }: { className?: string }) {
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  return <CurrencyIcon className={className} currency={baseCurrency} />;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Domain name for hasPermissionForDomain check (e.g. 'users', 'billing') */
  requiredDomain?: string;
  /** If true, only visible to users with system_admin.master */
  requiresMaster?: boolean;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Organizations', href: '/organizations', icon: Building2, requiredDomain: 'organizations' },
  { title: 'Users', href: '/users', icon: Users, requiredDomain: 'users' },
  { title: 'Workers', href: '/workers', icon: HardHat, requiredDomain: 'users' },
  {
    title: 'Payments',
    href: '/payments',
    icon: CreditCard,
    requiredDomain: 'billing',
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: DynamicCurrencyIcon,
    requiredDomain: 'billing',
  },
  {
    title: 'Payment Reminders',
    href: '/payment-reminders',
    icon: Bell,
    requiredDomain: 'billing',
  },
  {
    title: 'Audit Logs',
    href: '/audit-logs',
    icon: FileText,
    requiredDomain: 'reporting',
  },
  {
    title: 'Organization Deactivation',
    href: '/organizations/deactivation',
    icon: Ban,
    requiredDomain: 'organizations',
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: 'Roles',
    href: '/roles',
    icon: UserCog,
    requiresMaster: true,
  },
  {
    title: 'System Permissions',
    href: '/admin/permissions',
    icon: Shield,
    requiresMaster: true,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    requiresMaster: true,
  },
  { title: 'Help', href: '/help', icon: HelpCircle },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  open?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  isMobile: boolean;
  onClick?: () => void;
}

// eslint-disable-next-line complexity
function SidebarNavItem({ item, isActive, collapsed, isMobile, onClick }: SidebarNavItemProps) {
  return (
    <Tooltip key={item.href} delayDuration={0}>
      <TooltipTrigger asChild>
        <Link to={item.href}
          onClick={onClick}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-violet-100/70 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300',
            collapsed && !isMobile && 'justify-center px-2',
          )}>
          <div className={cn(
            'w-6 h-6 flex items-center justify-center shrink-0 rounded-md transition-colors',
            isActive
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
          )}>
            <item.icon className="h-5 w-5" />
          </div>
          {(!collapsed || isMobile) && <span>{item.title}</span>}
          {isActive && (!collapsed || isMobile) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />}
        </Link>
      </TooltipTrigger>
      {collapsed && !isMobile && (
        <TooltipContent side="right" className="font-medium">
          {item.title}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export function AdminSidebar({
  collapsed,
  open = true,
  isMobile = false,
  onClose,
}: AdminSidebarProps) {
  const location = useLocation();
  const { hasPermissionForDomain, hasSystemAdminMaster, loading: permissionsLoading } = usePermissions();

  const handleLinkClick = () => {
    if (isMobile) {
      onClose?.();
    }
  };

  const isNavItemVisible = (item: NavItem): boolean => {
    if (!item.requiredDomain && !item.requiresMaster) return true;
    if (permissionsLoading) return false;
    if (item.requiresMaster) return hasSystemAdminMaster;
    return hasPermissionForDomain(item.requiredDomain!);
  };

  // Filter nav items based on permissions
  const filteredMainNavItems = mainNavItems.filter(isNavItemVisible);
  const filteredBottomNavItems = bottomNavItems.filter(isNavItemVisible);

  return (
    <aside className={cn(
      'flex flex-col h-full border-r border-border bg-card transition-all duration-300 ease-in-out',
      !isMobile && (collapsed ? 'w-[64px]' : 'w-[256px]'),
      isMobile && ['fixed inset-y-0 left-0 z-50 w-[256px]', open ? 'translate-x-0' : '-translate-x-full'],
    )}>
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Horizon
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-0.5">
              Sync Admin
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredMainNavItems.map((item) => {
          const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
          return (
            <SidebarNavItem key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              isMobile={isMobile}
              onClick={handleLinkClick} />
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* Bottom Navigation */}
      <div className="py-4 px-3 space-y-1">
        {filteredBottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <SidebarNavItem key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              isMobile={isMobile}
              onClick={handleLinkClick} />
          );
        })}
      </div>
    </aside>
  );
}
