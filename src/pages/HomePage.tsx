import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * HomePage acts as a role-based router that redirects users
 * to their appropriate dashboard based on their role.
 */
export default function HomePage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Redirect based on user role
    switch (user?.role) {
        case 'dietitian':
            return <Navigate to="/dietitian/dashboard" replace />;
        case 'hospital':
            return <Navigate to="/hospital/dashboard" replace />;
        case 'patient':
        default:
            // For patients, guests, and any other users - show patient dashboard
            // We use lazy import to avoid circular dependencies
            return <Navigate to="/dashboard" replace />;
    }
}
