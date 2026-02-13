import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface MainLayoutProps {
    children?: ReactNode;
    pendingRequestsCount?: number;
    fullHeight?: boolean;
}

import { CommandPalette } from '@/components/ui/CommandPalette';
import { ConsentOverlay } from '@/components/auth/ConsentOverlay';

export function MainLayout({ children, pendingRequestsCount = 0, fullHeight = false }: MainLayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
                pendingRequestsCount={pendingRequestsCount}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <Header onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} />

                {/* Page Content */}
                <main className={`flex-1 flex flex-col min-h-0 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    <div className={fullHeight ? 'flex-1 flex flex-col min-h-0' : 'max-w-[1600px] w-full mx-auto px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]'}>
                        {children || <Outlet />}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}
            <CommandPalette />
            <ConsentOverlay />
        </div>
    );
}
