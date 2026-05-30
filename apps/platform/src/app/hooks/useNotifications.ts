import * as React from 'react';

import { NotificationService, NotificationItem } from '../services/notification.service';
import { useAuth } from './useAuth';

interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(options: {
  pageSize?: number;
  pollIntervalMs?: number;
} = {}): UseNotificationsResult {
  const { pageSize = 20, pollIntervalMs = 30000 } = options;
  const { accessToken } = useAuth();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);

  const fetchNotifications = React.useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await NotificationService.getNotifications(
          accessToken,
          targetPage,
          pageSize,
          false
        );
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setUnreadCount(data.unread_count);
        setTotalCount(data.pagination.total);
        setHasMore(data.pagination.has_next);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    },
    [accessToken, pageSize]
  );

  const refetch = React.useCallback(async () => {
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  const loadMore = React.useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(page + 1, true);
  }, [fetchNotifications, hasMore, loading, page]);

  const markAsRead = React.useCallback(
    async (notificationId: string) => {
      if (!accessToken) return;
      try {
        await NotificationService.markAsRead(notificationId, accessToken);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silent fail — user can retry
      }
    },
    [accessToken]
  );

  const markAllAsRead = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      await NotificationService.markAllAsRead(accessToken);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  }, [accessToken]);

  // Initial fetch
  React.useEffect(() => {
    if (accessToken) {
      refetch();
    }
  }, [accessToken, refetch]);

  // Polling
  React.useEffect(() => {
    if (!accessToken || pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      refetch();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [accessToken, pollIntervalMs, refetch]);

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    page,
    pageSize,
    hasMore,
    refetch,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
