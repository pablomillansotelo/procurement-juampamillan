'use client';

import { Notification } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
// Función helper para formatear tiempo relativo
const formatTimeAgo = (date: string | Date) => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  return d.toLocaleDateString('es-ES');
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead();
    }
  };

  const timeAgo = formatTimeAgo(notification.createdAt);

  const content = (
    <div
      className={cn(
        'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        isUnread && 'bg-muted/30'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
              {notification.title}
            </h4>
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

