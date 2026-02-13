import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, Home, ChevronRight, Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useState } from 'react';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
    const { user, profile } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const location = useLocation();
    const [notifOpen, setNotifOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    // Get profile URL based on role
    const getProfileUrl = () => {
        switch (user?.role) {
            case 'dietitian':
                return '/dietitian/profile';
            case 'hospital':
                return '/hospital/profile';
            default:
                return '/profile';
        }
    };

    // Get first letter of first name for avatar
    const getAvatarLetter = () => {
        if (profile) {
            const name = ('fname' in profile ? profile.fname : profile.name) || '';
            return name.charAt(0)?.toUpperCase() || 'U';
        }
        return 'U';
    };

    // Generate breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');

    // Custom label map for cleaner text
    const getLabel = (segment: string) => {
        const labels: Record<string, string> = {
            'home': 'Home',
            'dietitian': 'Dietitian',
            'hospital': 'Hospital',
            'plan': 'Daily Plan',
            'chat': 'AI Assistant',
            'recipes': 'Recipes',
            'analytics': 'Analytics',
            'bookmarks': 'Bookmarks',
            'my-dietitian': 'My Dietitian',
            'settings': 'Settings',
            'notifications': 'Notifications',
            'dashboard': 'Dashboard',
            'requests': 'Requests',
            'profile': 'My Profile',
            'search': 'Search',
            'patients': 'Patients',
            'chats': 'Chats'
        };
        return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    // Format notification time
    const formatTime = (timestamp: number) => {
        const diff = currentTime - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Get notification icon color based on type
    const getNotifColor = (type: string) => {
        switch (type) {
            case 'message': return 'bg-blue-100 text-blue-600';
            case 'reminder': return 'bg-amber-100 text-amber-600';
            case 'dietitian_request': return 'bg-green-100 text-green-600';
            case 'connection': return 'bg-purple-100 text-purple-600';
            case 'limit_change': return 'bg-teal-100 text-teal-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <header className="w-full border-b border-border bg-white">
            <div className="flex items-center justify-between gap-4 px-6 lg:px-8 py-4">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onMobileMenuToggle}
                        className="lg:hidden p-2 rounded-lg bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-all shadow-sm"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Breadcrumbs */}
                    <div className="hidden md:block">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                            <Home className="w-4 h-4" />
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>

                                {pathSegments.map((segment, index) => {
                                    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                                    const isLast = index === pathSegments.length - 1;
                                    const label = getLabel(segment);

                                    return (
                                        <React.Fragment key={path}>
                                            <BreadcrumbSeparator className="text-muted-foreground/40">
                                                <ChevronRight className="w-3 h-3" />
                                            </BreadcrumbSeparator>
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage className="text-sm font-semibold text-foreground">
                                                        {label}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link to={path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                            {label}
                                                        </Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </React.Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications Popup */}
                    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className="relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold border-2 border-background z-10 animate-in zoom-in duration-200 shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(380px,calc(100vw-2rem))] p-0 shadow-xl border-border/50 rounded-2xl overflow-hidden" align="end" sideOffset={8}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b bg-card/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg tracking-tight">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                                            onClick={() => markAllAsRead()}
                                            title="Mark all as read"
                                            aria-label="Mark all notifications as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => clearAll()}
                                            title="Clear all notifications"
                                            aria-label="Clear all notifications"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                            <Bell className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <h4 className="font-semibold text-foreground mb-1">No notifications</h4>
                                        <p className="text-sm text-muted-foreground max-w-[200px]">
                                            You're all caught up! Check back later for updates.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {notifications.map(notif => (
                                            <button
                                                type="button"
                                                key={notif.id}
                                                className={`group w-full text-left p-4 hover:bg-muted/40 transition-all cursor-pointer relative ${!notif.read ? 'bg-primary/[0.03]' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                                aria-label={`Open notification: ${notif.title}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${getNotifColor(notif.type)}`}>
                                                        <Bell className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm leading-none ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                                {notif.title}
                                                            </p>
                                                            {!notif.read && (
                                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-sm shadow-primary/20" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {notif.description}
                                                        </p>
                                                        <p className="text-xs font-medium text-muted-foreground/70 pt-1">
                                                            {formatTime(notif.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Search Button - Only for patients */}
                    {user?.role === 'patient' && (
                        <div className="relative group">
                            <Link
                                to="/search"
                                className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                aria-label="Search recipes"
                            >
                                <Search className="w-5 h-5" />
                            </Link>
                            <div className="absolute top-12 right-0 hidden group-hover:flex items-center gap-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md border animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                                <span>Search</span>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                    )}

                    {/* Profile Avatar - Role-based link */}
                    <Link
                        to={getProfileUrl()}
                        className="relative flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold text-sm rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                        aria-label="Profile"
                    >
                        {getAvatarLetter()}
                        {/* Status Dot */}
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    </Link>
                </div>
            </div>
        </header >
    );
}
