import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getPostAuthPath, getRoleHomePath, normalizeUserRole } from '@/lib/auth-routing';

interface ProtectedRouteProps {
    role?: 'patient' | 'dietitian' | 'hospital';
    redirectTo?: string;
}

export function ProtectedRoute({ role, redirectTo = '/login' }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isOnboarded, user } = useAuth();
    const resolvedRole = normalizeUserRole(user);

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

    if (!isOnboarded) {
        return <Navigate to={getPostAuthPath(resolvedRole, false)} replace />;
    }

    if (!resolvedRole) {
        return <Navigate to="/login" replace />;
    }

    // Check role-based access
    if (role && resolvedRole !== role) {
        return <Navigate to={getRoleHomePath(resolvedRole) ?? '/login'} replace />;
    }

    return <Outlet />;
}
