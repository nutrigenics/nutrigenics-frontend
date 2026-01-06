import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    role?: 'patient' | 'dietitian' | 'hospital';
    redirectTo?: string;
}

export function ProtectedRoute({ role, redirectTo = '/login' }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Check authentication
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Check role-based access
    if (role && user?.role !== role) {
        // Redirect to appropriate dashboard based on user role
        const dashboardRoutes = {
            patient: '/',
            dietitian: '/dietitian/dashboard',
            hospital: '/hospital/dashboard',
        };
        return <Navigate to={dashboardRoutes[user?.role || 'patient']} replace />;
    }

    return <Outlet />;
}
