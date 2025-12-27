'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './notification-item';
import { notificationsApi, type Notification } from '@/lib/api';
import { CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface NotificationDropdownProps {
  userId: number;
  onMarkAsRead: () => void;
  onMarkAllAsRead: () => void;
}

export function NotificationDropdown({
  userId,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll(userId, { limit: 10 });
      setNotifications(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead(userId);
      await loadNotifications();
      onMarkAllAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id, userId);
      await loadNotifications();
      onMarkAsRead();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Notificaciones</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t">
        <Link href="/notifications">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Ver todas las notificaciones
          </Button>
        </Link>
      </div>
    </div>
  );
}

