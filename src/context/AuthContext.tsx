import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import type { BaseUser, Patient, Dietitian, Hospital } from '@/types';
import { getPostAuthPath, normalizeUserRole, type AppRole } from '@/lib/auth-routing';

interface AuthNavigationResult {
    isOnboarded: boolean;
    redirectPath: string;
}

interface AuthContextType {
    user: BaseUser | null;
    profile: Patient | Dietitian | Hospital | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isOnboarded: boolean;
    login: (email: string, password: string) => Promise<AuthNavigationResult>;
    guestLogin: () => Promise<AuthNavigationResult>;
    signup: (email: string, password: string, role: 'patient' | 'dietitian' | 'hospital') => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<Patient | Dietitian | Hospital>) => Promise<void>;
    acceptConsent: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<BaseUser | null>(null);
    const [profile, setProfile] = useState<Patient | Dietitian | Hospital | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);

    const clearAuthState = () => {
        setUser(null);
        setProfile(null);
        setIsOnboarded(false);
        localStorage.removeItem('userProfile');
    };

    const buildNormalizedUser = (userData: BaseUser): (BaseUser & { role: AppRole }) | null => {
        const normalizedRole = normalizeUserRole(userData);
        if (!normalizedRole) {
            return null;
        }

        const normalizedUser = {
            ...userData,
            role: normalizedRole,
        } as BaseUser & { role: AppRole } & { dietician?: Dietitian | null };

        if (!normalizedUser.dietitian && 'dietician' in (userData as any)) {
            normalizedUser.dietitian = (userData as any).dietician ?? null;
        }

        return normalizedUser;
    };

    const persistProfile = (
        profileData: Patient | Dietitian | Hospital | null,
        userData: BaseUser
    ) => {
        if (!profileData) {
            localStorage.removeItem('userProfile');
            return;
        }

        localStorage.setItem('userProfile', JSON.stringify({
            ...profileData,
            user: { id: userData.id, email: userData.email }
        }));
    };

    const applyUserState = (userData: BaseUser) => {
        const normalizedUser = buildNormalizedUser(userData);
        if (!normalizedUser) {
            console.error('Authenticated user payload did not contain a valid role or profile. Clearing auth state.');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            clearAuthState();
            return null;
        }

        let nextProfile: Patient | Dietitian | Hospital | null = null;

        if (normalizedUser.role === 'patient') {
            nextProfile = normalizedUser.patient ?? null;
        } else if (normalizedUser.role === 'dietitian') {
            nextProfile = normalizedUser.dietitian ?? null;
        } else if (normalizedUser.role === 'hospital') {
            nextProfile = normalizedUser.hospital ?? null;
        }

        setUser(normalizedUser);
        setProfile(nextProfile);
        setIsOnboarded(Boolean(normalizedUser.is_onboarded));
        persistProfile(nextProfile, normalizedUser);
        return normalizedUser;
    };

    // Check authentication status on mount and listen for 401 events
    useEffect(() => {
        checkAuthStatus();

        const handleUnauthorized = () => {
            // console.debug('Received auth:unauthorized event, logging out...');
            logout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const checkAuthStatus = async (): Promise<AuthNavigationResult> => {
        try {
            // Check if we have a token first
            if (!authService.isAuthenticated()) {
                clearAuthState();
                setIsLoading(false);
                return { isOnboarded: false, redirectPath: '/login' };
            }

            try {
                const userData = await authService.getProfile();
                const normalizedUser = applyUserState(userData);
                const role = normalizeUserRole(normalizedUser);
                const isOnboarded = Boolean(normalizedUser?.is_onboarded);
                return {
                    isOnboarded,
                    redirectPath: getPostAuthPath(role, isOnboarded),
                };
            } catch (profileError: any) {
                if (profileError.response?.status === 401 || profileError.response?.status === 403) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    clearAuthState();
                    return { isOnboarded: false, redirectPath: '/login' };
                }

                console.error('Profile fetch failed with network/server error. Logging out user.');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                clearAuthState();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            clearAuthState();
        } finally {
            setIsLoading(false);
        }
        return { isOnboarded: false, redirectPath: '/login' };
    };

    const login = async (email: string, password: string): Promise<AuthNavigationResult> => {
        try {
            await authService.login({ email, password });
            return await checkAuthStatus();
        } catch (error) {
            throw error;
        }
    };

    const guestLogin = async (): Promise<AuthNavigationResult> => {
        try {
            await authService.guestLogin();
            return await checkAuthStatus();
        } catch (error) {
            throw error;
        }
    };

    const signup = async (email: string, password: string, role: 'patient' | 'dietitian' | 'hospital') => {
        try {
            const response = await authService.signup({
                email,
                password,
                password2: password,
                role,
            });
            applyUserState(response.user);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            clearAuthState();
            // Clean up notification-related storage
            localStorage.removeItem('seen_message_ids');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: Partial<Patient | Dietitian | Hospital>) => {
        try {
            const response = await authService.updateProfile(data as any);
            if (response.user) {
                applyUserState(response.user);
            }
        } catch (error) {
            throw error;
        }
    };

    const acceptConsent = async () => {
        try {
            const response = await authService.updateProfile({
                consent_accepted: true
            } as any);

            if (response.user) {
                applyUserState(response.user);
            }
        } catch (error) {
            console.error('Consent acceptance failed:', error);
            throw error;
        }
    };

    const refreshUser = async () => {
        await checkAuthStatus();
    };

    const value: AuthContextType = {
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isOnboarded,
        login,
        guestLogin,
        signup,
        logout,
        updateProfile,
        acceptConsent,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
