import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Sparkles,
    Book,
    ChartPie,
    Bookmark,
    Stethoscope,
    LogOut,
    ChevronLeft,
    User,
    UserCog,
    MessageSquare,
    Settings,
    Building2,
    FileText,
    Users,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import logo from '@/assets/logo.svg';

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    pendingRequestsCount?: number;
}


const patientNavItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Daily Plan', href: '/plan', icon: Calendar },
    { name: 'Chat with AI', href: '/chat', icon: Sparkles },
    { name: 'Recipes', href: '/recipes', icon: Book },
    { name: 'Analytics', href: '/analytics', icon: ChartPie },
    { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { name: 'My Dietitian', href: '/my-dietitian', icon: Stethoscope },
];

const dietitianNavItems = [
    { name: 'Dashboard', href: '/dietitian/dashboard', icon: LayoutDashboard },
    { name: 'My Patients', href: '/dietitian/patients', icon: User },
    { name: 'Messages', href: '/dietitian/chats', icon: MessageSquare },
    { name: 'Profile', href: '/dietitian/profile', icon: UserCog },
];

const hospitalNavItems = [
    { name: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
    { name: 'Dietitians', href: '/hospital/dietitians', icon: Users },
    { name: 'Requests', href: '/hospital/requests', icon: FileText },
    { name: 'Profile', href: '/hospital/profile', icon: Building2 },
];

const commonNavItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isMobileOpen, onMobileClose, pendingRequestsCount = 0 }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Determine which nav items to show based on user role
    const getNavItems = () => {
        // Default to public/patient items if no role found (or handle strictly)
        if (!user?.role) return patientNavItems;

        switch (user.role) {
            case 'dietitian':
                return dietitianNavItems;
            case 'hospital':
                return hospitalNavItems;
            case 'patient':
            default:
                return patientNavItems;
        }
    };

    const mainNavItems = getNavItems();
    const allNavItems = [...mainNavItems, ...commonNavItems];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect to login even if logout API fails
            navigate('/login');
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'sidebar h-full flex-shrink-0 z-50 lg:z-auto transition-transform duration-300 ease-in-out',
                    'w-[80px] lg:w-[90px] bg-sidebar border-r border-sidebar-border',
                    'lg:static fixed inset-y-0 left-0',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <nav className="w-full h-full py-6 flex flex-col items-center justify-between">

                    {/* Top Section */}
                    <div className="flex flex-col items-center w-full gap-8">
                        {/* Logo */}
                        <div className="relative group">
                            <Link
                                to="/"
                                className="block transition-transform duration-300 hover:scale-105"
                            >
                                <div className="p-2 rounded-xl bg-gradient-to-br from-sidebar-primary/20 to-transparent">
                                    <img src={logo} alt="Nutrigenics" className="w-8 h-8 lg:w-9 lg:h-9" />
                                </div>
                            </Link>

                            {/* Close button (mobile only) */}
                            <button
                                onClick={onMobileClose}
                                className="lg:hidden absolute -right-12 top-0 p-2 bg-background rounded-md shadow-md border border-border"
                                aria-label="Close menu"
                            >
                                <ChevronLeft className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <div className="flex flex-col gap-3 w-full items-center px-2">
                            {allNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;

                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={item.href}
                                                className={cn(
                                                    'p-3 rounded-2xl transition-all duration-300 relative group flex items-center justify-center',
                                                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                    isActive
                                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                                                        : 'text-muted-foreground'
                                                )}
                                                aria-label={item.name}
                                                onClick={() => isMobileOpen && onMobileClose?.()}
                                            >
                                                <Icon className={cn(
                                                    "w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300",
                                                    isActive ? "scale-105" : "group-hover:scale-110"
                                                )} />

                                                {/* Notification Badge */}
                                                {item.href === '/my-dietitian' && pendingRequestsCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm animate-pulse border-2 border-sidebar">
                                                        {pendingRequestsCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={16} className="bg-popover text-popover-foreground font-medium text-sm px-3 py-1.5 rounded-lg shadow-elevation border border-border/50">
                                            {item.name}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Section: Logout */}
                    <div className="pb-4 w-full flex justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleLogout}
                                    className="p-3 rounded-2xl transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/70"
                                    aria-label="Log out"
                                >
                                    <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={16} className="bg-destructive text-destructive-foreground font-medium px-3 py-1.5 rounded-lg shadow-md border-0">
                                Log out
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </nav>
            </aside>
        </TooltipProvider>
    );
}
