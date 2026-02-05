import { useMemo } from 'react';
import { Profile } from '../types';

export function usePermission(profile: Profile | null) {
    return useMemo(() => {
        if (!profile) {
            return {
                isAdmin: false,
                canDelete: false,
                canEditSettings: false,
                canViewBudget: false,
            };
        }

        const { role } = profile;
        const isAdmin = role === 'admin';
        const isMember = role === 'member';

        return {
            isAdmin: isAdmin,
            canDelete: isAdmin || isMember,
            canEditSettings: isAdmin,
            canViewBudget: isAdmin || isMember,
        };
    }, [profile]);
}
