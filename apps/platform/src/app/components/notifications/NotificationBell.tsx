import * as React from 'react';

import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Package,
  Truck,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

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

import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../services/notification.service';

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'asn_created':
    case 'asn_confirmed':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'fulfillment_completed':
    case 'fulfillment_partially_completed':
    case 'fulfillment_initiated':
      return <Truck className="h-4 w-4 text-green-500" />;
    case 'asn_cancelled':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const { id, title, message, created_at, is_read, type, entity_type, entity_id } = notification;

  const timeAgo = React.useMemo(() => {
    const now = new Date();
    const created = new Date(created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, [created_at]);

  const handleClick = () => {
    if (!is_read) {
      onMarkRead(id);
    }
    // Navigate to the related entity if applicable
    if (entity_type === 'asn_order' && entity_id) {
      // Navigation handled by consuming app if needed
    }
  };

  return (
    <div
      className={`relative flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
        !is_read ? 'bg-muted/20' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {!is_read && (
        <span className="absolute left-0 top-3 h-1.5 w-1.5 rounded-full bg-violet-500" />
      )}
      <div className="mt-0.5 shrink-0">
        <NotificationIcon type={type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!is_read ? 'font-medium' : 'font-normal'} text-foreground`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>
      {!is_read && (
        <button
          className="mt-1 shrink-0 rounded p-1 hover:bg-muted text-muted-foreground"
          title="Mark as read"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(id);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ pageSize: 10, pollIntervalMs: 30000 });

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-medium text-white ring-2 ring-card">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}

          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
            />
          ))}

          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasMore && !loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadMore();
              }}
              className="flex w-full items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Load more
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
