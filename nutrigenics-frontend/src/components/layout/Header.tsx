import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, Home, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { Patient } from '@/types';
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
import React from 'react';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
    const { profile } = useAuth();
    const { setTheme } = useTheme();
    const patient = profile as Patient;
    const location = useLocation();

    // Get first letter of first name for avatar
    const avatarLetter = patient?.fname?.charAt(0)?.toUpperCase() || 'U';

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
            'search': 'Search'
        };
        return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
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

                    {/* Profile Avatar */}
                    <Link
                        to="/profile"
                        className="relative flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold text-sm rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                        aria-label="Profile"
                    >
                        {avatarLetter}

                        {/* Status Dot */}
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
