import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { notificationService, type Notification as ApiNotification } from '@/services/notification.service';

export interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    timestamp: number;
    type: string;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const seenIds = useRef<Set<number>>(new Set());

    const unreadCount = notifications.filter(n => !n.read).length;

    // Request Notification Permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Poll notifications from API
    const fetchNotifications = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            const data = await notificationService.getNotifications();

            // Check for new notifications to trigger browser notification
            data.forEach((notif: ApiNotification) => {
                if (!seenIds.current.has(notif.id) && !notif.is_read) {
                    seenIds.current.add(notif.id);

                    // Browser Notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new window.Notification(notif.title, {
                            body: notif.message,
                            icon: '/favicon.ico'
                        });
                    }
                }
            });

            // Map to frontend format
            const formatted: Notification[] = data.map((n: ApiNotification) => ({
                id: n.id.toString(),
                title: n.title,
                description: n.message,
                time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(n.created_at).getTime(),
                type: n.notification_type,
                read: n.is_read
            }));

            setNotifications(formatted);
        } catch (error) {
            // Silently fail if not logged in or API error
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markRead(parseInt(id));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const clearAll = async () => {
        try {
            await notificationService.clearAll();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    const refetch = () => {
        fetchNotifications();
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, refetch }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
