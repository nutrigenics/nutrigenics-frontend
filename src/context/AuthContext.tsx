import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import apiClient from '@/services/api.client';
import type { BaseUser, Patient, Dietitian, Hospital } from '@/types';

interface AuthContextType {
    user: BaseUser | null;
    profile: Patient | Dietitian | Hospital | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isOnboarded: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    guestLogin: () => Promise<boolean>;
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

    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            // Check if we have a token first
            if (!authService.isAuthenticated()) {
                setUser(null);
                setProfile(null);
                setIsOnboarded(false);
                setIsLoading(false);
                return false;
            }

            // Fetch user profile from backend
            try {
                const response = await apiClient.get('/api/v1/auth/profile/');
                const userData = response.data;

                // Set base user
                // Set base user with all profile data
                setUser(userData as BaseUser);

                // Check if user is onboarded based on role
                let onboarded = false;
                if (userData.role === 'patient' && userData.patient) {
                    setProfile(userData.patient);
                    // Store profile with user info for notification polling
                    localStorage.setItem('userProfile', JSON.stringify({
                        ...userData.patient,
                        user: { id: userData.id, email: userData.email }
                    }));
                    onboarded = !!userData.patient.fname; // Has completed onboarding
                } else if (userData.role === 'dietitian' && userData.dietitian) {
                    setProfile(userData.dietitian);
                    localStorage.setItem('userProfile', JSON.stringify({
                        ...userData.dietitian,
                        user: { id: userData.id, email: userData.email }
                    }));
                    onboarded = !!userData.dietitian.fname;
                } else if (userData.role === 'hospital' && userData.hospital) {
                    setProfile(userData.hospital);
                    localStorage.setItem('userProfile', JSON.stringify({
                        ...userData.hospital,
                        user: { id: userData.id, email: userData.email }
                    }));
                    onboarded = !!userData.hospital.name;
                } else {
                    // Fallback: try to get role-specific profile
                    onboarded = userData.is_onboarded || false;
                }

                setIsOnboarded(onboarded);
                return onboarded;
            } catch (profileError: any) {
                console.warn('Could not fetch profile:', profileError);

                // Clear auth if the issue is an authentication error (401/403)
                if (profileError.response?.status === 401 || profileError.response?.status === 403) {
                    console.warn('Authentication failed, clearing tokens');
                    setUser(null);
                    setProfile(null);
                    setIsOnboarded(false);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    return false;
                }

                // For network errors or server issues, show error but keep trying
                console.error('Profile fetch failed with network/server error. Logging out user.');
                // Clear auth state on any profile fetch failure to prevent zombie auth
                setUser(null);
                setProfile(null);
                setIsOnboarded(false);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Clear auth state on errors to prevent zombie auth
            setUser(null);
            setProfile(null);
            setIsOnboarded(false);
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // authService.login stores tokens in localStorage
            await authService.login({ email, password });

            // Fetch profile after successful login and return onboarding status
            const isOnboarded = await checkAuthStatus();
            return isOnboarded;
        } catch (error) {
            throw error;
        }
    };

    const guestLogin = async (): Promise<boolean> => {
        try {
            // authService.guestLogin stores tokens in localStorage
            await authService.guestLogin();

            // Fetch profile after successful login and return onboarding status
            const isOnboarded = await checkAuthStatus();
            return isOnboarded;
        } catch (error) {
            throw error;
        }
    };

    const signup = async (email: string, password: string, role: 'patient' | 'dietitian' | 'hospital') => {
        try {
            // Call registration endpoint
            const response = await apiClient.post('/api/v1/auth/register/', {
                email,
                password,
                password_confirm: password,
                role,
            });

            // If registration returns tokens, store them
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }
            if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
            }

            // Set user data
            const userData = response.data.user || {
                id: response.data.id,
                email: email,
                role: role,
            };

            setUser(userData);
            setIsOnboarded(false); // New users need onboarding
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setProfile(null);
            setIsOnboarded(false);
            // Clean up notification-related storage
            localStorage.removeItem('userProfile');
            localStorage.removeItem('seen_message_ids');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: Partial<Patient | Dietitian | Hospital>) => {
        try {
            const response = await authService.updateProfile(data as any);
            setProfile(response.user);
        } catch (error) {
            throw error;
        }
    };

    const acceptConsent = async () => {
        try {
            // Update profile with consent_accepted = true
            const response = await authService.updateProfile({
                consent_accepted: true
            } as any);

            // The response.user contains the updated profile
            if (response.user) {
                setProfile(response.user);

                // Update localStorage to keep notification polling in sync
                const storedProfile = localStorage.getItem('userProfile');
                if (storedProfile) {
                    const parsedProfile = JSON.parse(storedProfile);
                    localStorage.setItem('userProfile', JSON.stringify({
                        ...parsedProfile,
                        consent_accepted: true
                    }));
                }
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
        isAuthenticated: !!user,  // Simplified: only check user state to prevent re-renders
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
