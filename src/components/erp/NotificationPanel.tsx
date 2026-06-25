'use client';

import { erpFetch } from '@/lib/api-client';
import { useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Bell, Check } from 'lucide-react';
import { useErpStore } from '@/lib/store';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  section?: string;
}

export default function NotificationPanel() {
  const { notificationsOpen, setNotificationsOpen, setActiveSection } = useErpStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  const markAsRead = async (id: string, section?: string) => {
    try {
      await erpFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (section) {
        setActiveSection(section);
        setNotificationsOpen(false);
      }
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                n.read ? 'bg-transparent hover:bg-muted/50' : 'bg-muted/30 border-primary/20 hover:bg-muted/50'
              }`}
              onClick={() => markAsRead(n.id, n.section)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(n.time)}</p>
              </div>
              {n.read && <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}