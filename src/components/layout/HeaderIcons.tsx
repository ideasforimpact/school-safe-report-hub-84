import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { getIsBackofficeUser } from '@/store/authSelectors';

const PAGE_SIZE = 10;

const SUPPORTED_NOTIFICATION_MODULES: ReadonlySet<string> = new Set([
  'incident',
  'assessment',
  'grievance',
]);

interface NotificationItem {
  id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notification: {
    id: string;
    module_id: string | null;
    module_name: string;
    notification_type: string;
    title: string | null;
    message: string | null;
    created_at: string;
  };
}

const getModuleNameFromPath = (pathname: string): string => {
  if (pathname.startsWith('/incidents') || pathname.startsWith('/incident') || pathname.startsWith('/report-incident')) return 'incident';
  if (pathname.startsWith('/assessments') || pathname.startsWith('/assessment')) return 'assessment';
  if (pathname.startsWith('/forms')) return 'grievance';
  if (pathname.startsWith('/employee-verification')) return 'employee-verification';
  if (pathname.startsWith('/transport-safety')) return 'transport-safety';
  if (pathname.startsWith('/child-audit')) return 'child-audit';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  return 'all';
};

const formatTimeAgo = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const HeaderIcons = () => {
  const location = useLocation();
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  const isBackofficeRoute =
    location.pathname.startsWith('/backoffice') ||
    location.pathname.startsWith('/backoffice-');

  const currentModuleName = useMemo(() => getModuleNameFromPath(location.pathname), [location.pathname]);
  const isUnsupportedModule = !SUPPORTED_NOTIFICATION_MODULES.has(currentModuleName);
  const skipNotifications = isBackofficeRoute || isBackofficeUser || isUnsupportedModule;
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [scrollRootNode, setScrollRootNode] = useState<HTMLDivElement | null>(null);

  const fetchFirstPage = useCallback(async () => {
    if (skipNotifications) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-notification-summary', {
        body: {
          module_name: currentModuleName === 'all' ? null : currentModuleName,
          limit: PAGE_SIZE,
        },
      });

      if (error) {
        console.error('Failed to fetch notification summary:', error);
        return;
      }

      setUnreadCount(data?.unread_count ?? 0);
      setNotifications((data?.notifications ?? []) as NotificationItem[]);
      const cursor = (data?.next_cursor ?? null) as string | null;
      setNextCursor(cursor);
      setHasMore(Boolean(cursor));
    } catch (error) {
      console.error('Failed to fetch notification summary:', error);
    } finally {
      setLoading(false);
    }
  }, [currentModuleName, skipNotifications]);

  const fetchNextPage = useCallback(async () => {
    if (skipNotifications || loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-notification-summary', {
        body: {
          module_name: currentModuleName === 'all' ? null : currentModuleName,
          limit: PAGE_SIZE,
          cursor: nextCursor,
        },
      });

      if (error) {
        console.error('Failed to fetch more notifications:', error);
        return;
      }

      const newItems = (data?.notifications ?? []) as NotificationItem[];
      setNotifications((prev) => {
        if (newItems.length === 0) return prev;
        const existingIds = new Set(prev.map((item) => item.id));
        const deduped = newItems.filter((item) => !existingIds.has(item.id));
        return deduped.length === 0 ? prev : [...prev, ...deduped];
      });
      const cursor = (data?.next_cursor ?? null) as string | null;
      setNextCursor(cursor);
      setHasMore(Boolean(cursor));
    } catch (error) {
      console.error('Failed to fetch more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [skipNotifications, loadingMore, hasMore, nextCursor, currentModuleName]);

  useEffect(() => {
    if (skipNotifications) {
      setUnreadCount(0);
      setNotifications([]);
      setNextCursor(null);
      setHasMore(false);
      setLoading(false);
      return;
    }
    fetchFirstPage();
  }, [fetchFirstPage, skipNotifications]);

  useEffect(() => {
    if (!sentinelNode || !scrollRootNode) return;
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { root: scrollRootNode, threshold: 0.1 },
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, scrollRootNode, hasMore, loadingMore, loading, fetchNextPage]);

  useEffect(() => {
    if (skipNotifications) return;
    if (!employeeData?.id) return;

    const recipientChannel = supabase
      .channel(`notifications-recipient-${employeeData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'centralized_notification_recipients',
          filter: `recipient_employee_id=eq.${employeeData.id}`,
        },
        () => {
          fetchFirstPage();
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel(`notifications-module-${employeeData.id}-${currentModuleName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'centralized_notifications',
        },
        () => {
          fetchFirstPage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(recipientChannel);
      supabase.removeChannel(notificationChannel);
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    };
  }, [employeeData?.id, currentModuleName, fetchFirstPage, skipNotifications]);

  const markAsRead = useCallback(async (recipientNotificationId: string) => {
    if (skipNotifications) return;
    try {
      const { error } = await supabase.functions.invoke('mark-notification-read', {
        body: {
          recipient_notification_id: recipientNotificationId,
        },
      });

      if (error) {
        console.error('Failed to mark notification as read:', error);
        return;
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === recipientNotificationId ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [skipNotifications]);

  if (skipNotifications) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Latest for current module</p>
        </div>
        <div ref={setScrollRootNode} className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-3">
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[75%]" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No notifications found.</p>
          ) : (
            <>
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left p-3 border-b hover:bg-muted/50 ${item.is_read ? 'opacity-70' : ''}`}
                  onClick={() => {
                    if (!item.is_read) {
                      markAsRead(item.id);
                    }
                  }}
                >
                  <p className="text-sm font-medium">{item.notification?.title || 'Notification'}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.notification?.message || item.notification?.notification_type || 'New update'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatTimeAgo(item.notification?.created_at)}
                  </p>
                </button>
              ))}
              {hasMore && (
                <div ref={setSentinelNode} className="flex items-center justify-center p-3">
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="h-4 w-4" aria-hidden />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderIcons;
