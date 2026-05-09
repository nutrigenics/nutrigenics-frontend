import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { getPostAuthPath, normalizeUserRole } from '@/lib/auth-routing';

/**
 * HomePage acts as a role-based router that redirects users
 * to their appropriate dashboard based on their role.
 */
export default function HomePage() {
    const { user, isLoading, isOnboarded } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <Navigate to={getPostAuthPath(normalizeUserRole(user), isOnboarded)} replace />;
}
