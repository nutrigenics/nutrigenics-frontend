import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    timestamp: number;
    type: 'message' | 'reminder' | 'system';
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'time'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : [];
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Request Notification Permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Reminder Logic
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const hour = now.getHours();
            const todayStr = now.toDateString();

            // Get last check data from localStorage
            const remindersSent = JSON.parse(localStorage.getItem('reminders_log') || '{}');

            if (remindersSent.date !== todayStr) {
                remindersSent.date = todayStr;
                remindersSent.breakfast = false;
                remindersSent.lunch = false;
                remindersSent.dinner = false;
            }

            // Breakfast: 7 AM - 10 AM
            if (hour >= 7 && hour < 10 && !remindersSent.breakfast) {
                triggerReminder("Good Morning! ☀️", "Time for breakfast! Don't forget to log your meal.");
                remindersSent.breakfast = true;
            }

            // Lunch: 12 PM - 2 PM (14:00)
            if (hour >= 12 && hour < 14 && !remindersSent.lunch) {
                triggerReminder("It's Lunchtime! 🥗", "Remember to have a healthy lunch and track it.");
                remindersSent.lunch = true;
            }

            // Dinner: 7 PM (19:00) - 9 PM (21:00)
            if (hour >= 19 && hour < 21 && !remindersSent.dinner) {
                triggerReminder("Dinner Time 🌙", "Time to wind down with a nutritious dinner.");
                remindersSent.dinner = true;
            }

            localStorage.setItem('reminders_log', JSON.stringify(remindersSent));
        };

        const triggerReminder = (title: string, msg: string) => {
            const newNotif: Notification = {
                id: Date.now().toString(),
                title: title,
                description: msg,
                time: 'Just now',
                timestamp: Date.now(),
                type: 'reminder',
                read: false
            };
            setNotifications(prev => [newNotif, ...prev]);

            // Browser Notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body: msg });
            }
        };

        const interval = setInterval(checkReminders, 60000); // Check every minute
        checkReminders(); // Initial check

        return () => clearInterval(interval);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const addNotification = (n: Omit<Notification, 'id' | 'timestamp' | 'read' | 'time'>) => {
        const newNotif: Notification = {
            ...n,
            id: Date.now().toString(),
            time: 'Just now',
            timestamp: Date.now(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
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
