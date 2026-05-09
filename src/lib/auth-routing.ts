import type { BaseUser } from '@/types';

export type AppRole = 'patient' | 'dietitian' | 'hospital';

const ROLE_HOME_PATHS: Record<AppRole, string> = {
    patient: '/dashboard',
    dietitian: '/dietitian/dashboard',
    hospital: '/hospital/dashboard',
};

const ROLE_PROFILE_PATHS: Record<AppRole, string> = {
    patient: '/profile',
    dietitian: '/dietitian/profile',
    hospital: '/hospital/profile',
};

type UserWithLegacyDietician = BaseUser & {
    dietician?: BaseUser['dietitian'];
};

export function normalizeUserRole(user: Partial<UserWithLegacyDietician> | null | undefined): AppRole | null {
    if (!user) {
        return null;
    }

    const rawRole = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
    if (rawRole === 'patient' || rawRole === 'dietitian' || rawRole === 'hospital') {
        return rawRole;
    }

    if (user.patient) {
        return 'patient';
    }
    if (user.dietitian || user.dietician) {
        return 'dietitian';
    }
    if (user.hospital) {
        return 'hospital';
    }

    return null;
}

export function getRoleHomePath(role: AppRole | null | undefined): string | null {
    if (!role) {
        return null;
    }
    return ROLE_HOME_PATHS[role];
}

export function getRoleProfilePath(role: AppRole | null | undefined): string | null {
    if (!role) {
        return null;
    }
    return ROLE_PROFILE_PATHS[role];
}

export function getPostAuthPath(role: AppRole | null | undefined, isOnboarded: boolean): string {
    if (!isOnboarded) {
        return '/onboarding';
    }

    return getRoleHomePath(role) ?? '/login';
}
