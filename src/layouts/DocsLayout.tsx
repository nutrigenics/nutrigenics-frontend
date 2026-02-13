import { Outlet, NavLink, Link } from 'react-router-dom';
import { Book, BarChart2, FileText, ChevronRight, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/layouts/MainLayout';

export default function DocsLayout() {
    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <Book className="w-5 h-5 text-primary" />
                                    Documentation
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Official guides and technical references for the Nutrigenics platform.
                                </p>
                            </div>

                            <nav className="space-y-1">
                                <DocsLink to="/docs/analytics" icon={<BarChart2 className="w-4 h-4" />}>
                                    Analytics Dashboard
                                </DocsLink>
                                {/* Placeholders for future docs */}
                                <DocsLink to="/docs/meal-planning" icon={<PieChart className="w-4 h-4" />} disabled>
                                    Meal Planning
                                </DocsLink>
                                <DocsLink to="/docs/api" icon={<FileText className="w-4 h-4" />} disabled>
                                    API Reference
                                </DocsLink>
                            </nav>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-semibold text-blue-900 text-sm mb-1">Need specific help?</h4>
                                <p className="text-xs text-blue-700 mb-3">
                                    Our support team is available to explain any metric in detail.
                                </p>
                                <Link to="/contact" className="text-xs font-bold text-blue-600 hover:underline">
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
}

// Helper Component for Sidebar Links
function DocsLink({ to, children, icon, disabled = false }: { to: string; children: React.ReactNode; icon: React.ReactNode; disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed opacity-60">
                {icon}
                <span className="flex-1">{children}</span>
                <span className="text-xs uppercase font-bold bg-gray-100 px-1.5 py-0.5 rounded">Soon</span>
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span className={cn("transition-colors", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")}>
                        {icon}
                    </span>
                    <span className="flex-1">{children}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                </>
            )}
        </NavLink>
    );
}
