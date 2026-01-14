import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, Home, ChevronRight, Sun, Moon, Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState } from 'react';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
    const { user, profile } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { setTheme } = useTheme();
    const location = useLocation();
    const [notifOpen, setNotifOpen] = useState(false);

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
            const name = (profile as any).fname || (profile as any).name || '';
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
        const diff = Date.now() - timestamp;
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
        <header className="w-full border-b border-border bg-background">
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
                    {/* Theme Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                System
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Notifications Popup */}
                    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className="relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-white z-10 animate-in zoom-in duration-200">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96 p-0" align="end">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-bold text-lg">Notifications</h3>
                                {notifications.length > 0 && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => markAllAsRead()}
                                        >
                                            <Check className="w-3 h-3 mr-1" /> Mark all read
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-destructive hover:text-destructive"
                                            onClick={() => clearAll()}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Clear all
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Notification List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No notifications</p>
                                        <p className="text-sm">You're all caught up!</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getNotifColor(notif.type)}`}>
                                                    <Bell className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-sm truncate">{notif.title}</p>
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{notif.description}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{formatTime(notif.timestamp)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Search Button */}
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
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>

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
        </header>
    );
}
