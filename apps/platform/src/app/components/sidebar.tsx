import * as React from 'react';

import { LayoutDashboard, Package, BarChart3, Settings, Users, FileText, HelpCircle, CreditCard, DollarSign, ShoppingCart, BookOpen, Shield, Receipt, Building2, QrCode, Warehouse } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';
import { cn } from '@horizon-sync/ui/lib';

import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { usePermissions } from '../hooks/usePermissions';
import { useFeatureVisibilities } from '@horizon-sync/ui/hooks';
import { environment } from '../../environments/environment';
import { CurrencyIcon } from '@horizon-sync/ui';

import logoLight from '../../assets/ciphercode_571_logo.png';
import logoDark from '../../assets/White_Ciphercode.webp';
import logoMark from '../../assets/ciphercode_528_logo.png';

/** Wrapper that reads baseCurrency from the store and passes it to CurrencyIcon */
function DynamicCurrencyIcon({ className }: { className?: string }) {
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  return <CurrencyIcon className={className} currency={baseCurrency} />;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Feature flag name — when set, the item is hidden if visible=false */
  featureFlag?: string;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Inventory', href: '/inventory', icon: Package, featureFlag: 'inventory_module_enabled' },
  { title: 'Revenue', href: '/revenue', icon: DynamicCurrencyIcon, featureFlag: 'revenue_module_enabled' },
  { title: 'Sourcing', href: '/sourcing', icon: ShoppingCart, featureFlag: 'sourcing_module_enabled' },
  { title: 'Books', href: '/books', icon: BookOpen, featureFlag: 'book_module_enabled' },
  { title: 'Tax & Charges', href: '/tax-charges', icon: Receipt, featureFlag: 'taxandcharges_module_enabled' },
  { title: 'Subscriptions', href: '/subscriptions', icon: CreditCard, featureFlag: 'subscriptions_module_enabled' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, featureFlag: 'analytics_module_enabled' },
  { title: 'QSeal', href: '/qseal', icon: QrCode, featureFlag: 'qseal_module_enabled' },
  { title: 'WMS', href: '/wms', icon: Warehouse, featureFlag: 'wms_module_enabled' },
  { title: 'Users', href: '/users', icon: Users, featureFlag: 'users_module_enabled' },
  { title: 'Roles', href: '/roles', icon: Shield, featureFlag: 'roles_module_enabled' },
  { title: 'Reports', href: '/reports', icon: FileText, featureFlag: 'reports_module_enabled' },
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
              ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && !isMobile && 'justify-center px-2',
          )}>
          <item.icon className={cn(
            'h-5 w-5 shrink-0 transition-colors',
            isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground group-hover:text-foreground',
          )} />
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

export function Sidebar({ open = true, collapsed = false, isMobile = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { filterNavigation } = usePermissions();
  const accessToken = useUserStore((s) => s.accessToken);

  // Get unique feature flag names from nav items
  const featureFlagNames = React.useMemo(() =>
    [...new Set(mainNavItems
      .filter((item) => item.featureFlag)
      .map((item) => item.featureFlag!)
    )], []
  );

  // Call useFeatureVisibilities for all flags at once
  const flagStates = useFeatureVisibilities(featureFlagNames, `${environment.apiCoreUrl}/api/v1`, accessToken);

  // Build a map of flag name → visible (only the visible property for filtering)
  const flagVisibility: Record<string, boolean> = React.useMemo(() => {
    const visibility: Record<string, boolean> = {};
    featureFlagNames.forEach(flagName => {
      visibility[flagName] = flagStates[flagName]?.visible ?? false;
    });
    return visibility;
  }, [flagStates, featureFlagNames]);

  // True while any feature flag is still loading — hide flagged items to prevent flash
  const flagsLoading = featureFlagNames.length > 0 &&
    featureFlagNames.some(name => flagStates[name]?.loading);

  const handleLinkClick = () => {
    if (isMobile) {
      onClose?.();
    }
  };

  // Filter navigation items based on user permissions, then feature flags
  const filteredMainNavItems = React.useMemo(() => {
    const permFiltered = filterNavigation(mainNavItems);
    return permFiltered.filter((item) => {
      if (!item.featureFlag) return true;
      // While flags are loading, hide items that have a featureFlag to prevent flash
      if (flagsLoading) return false;
      return flagVisibility[item.featureFlag] !== false;
    });
  }, [filterNavigation, flagVisibility, flagsLoading]);

  const filteredBottomNavItems = React.useMemo(() => {
    return filterNavigation(bottomNavItems);
  }, [filterNavigation]);

  return (
    <aside className={cn(
      'flex flex-col h-full border-r border-border bg-card transition-all duration-300 ease-in-out',
      !isMobile && (collapsed ? 'w-[70px]' : 'w-[260px]'),
      isMobile && ['fixed inset-y-0 left-0 z-50 w-[260px]', open ? 'translate-x-0' : '-translate-x-full'],
    )}>
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        {collapsed ? (
          <img src={logoMark} alt="Ciphercode" className="h-9 w-9 shrink-0 object-contain" />
        ) : (
          <>
            <img src={logoLight} alt="Ciphercode" className="h-8 w-auto max-w-[180px] shrink-0 object-contain object-left dark:hidden" />
            <img src={logoDark} alt="Ciphercode" className="h-8 w-auto max-w-[180px] shrink-0 object-contain object-left hidden dark:block" />
          </>
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
