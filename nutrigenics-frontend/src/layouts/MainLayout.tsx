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

export function MainLayout({ children, pendingRequestsCount = 0, fullHeight = false }: MainLayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
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
                <main className={`flex-1 ${fullHeight ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
                    <div className={`w-full ${fullHeight ? 'h-full flex flex-col' : 'px-6 lg:px-8 py-8 min-h-[calc(100vh-8rem)]'}`}>
                        {children || <Outlet />}
                    </div>


                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}
            <CommandPalette />
        </div>
    );
}
