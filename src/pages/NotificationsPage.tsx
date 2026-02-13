import { useState } from 'react';
import { Bell, Calendar, MessagesSquare, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
        markAsRead(id);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {notifications.length}
                    </span>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button onClick={markAllAsRead} variant="ghost" size="sm" className="text-primary gap-2 hover:bg-primary/10">
                        <CheckCheck className="w-4 h-4" /> Mark all as read
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300 cursor-pointer group hover:shadow-md",
                                notification.read
                                    ? 'bg-card border-border shadow-sm'
                                    : 'bg-primary/5 border-primary/20 shadow-md'
                            )}
                            onClick={() => toggleExpand(notification.id)}
                        >
                            <CardContent className="p-5">
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl flex-shrink-0 h-fit transition-colors",
                                        notification.read
                                            ? 'bg-muted text-muted-foreground'
                                            : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                    )}>
                                        {notification.type === 'message' ? <MessagesSquare className="w-5 h-5" /> :
                                            notification.type === 'reminder' ? <Calendar className="w-5 h-5" /> :
                                                <Bell className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className={cn(
                                                "font-semibold truncate pr-8 text-base",
                                                notification.read ? 'text-foreground' : 'text-primary'
                                            )}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-muted-foreground flex-shrink-0 font-medium whitespace-nowrap">
                                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="mt-1 relative">
                                            <p className={cn(
                                                "text-muted-foreground text-sm transition-all duration-300",
                                                expandedId === notification.id ? "" : "line-clamp-1"
                                            )}>
                                                {notification.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Expand Indicator */}
                            <div className="absolute right-4 top-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                                {expandedId === notification.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </Card>
                    ))}
                </AnimatePresence>
            </div>

            {notifications.length === 0 && (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border mt-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No notifications yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-xs mx-auto text-sm">We'll let you know when something important happens on your journey.</p>
                </div>
            )}
        </div>
    );
}
