import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeColor = 'indigo' | 'slate' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'violet' | 'fuchsia' | 'orange' | 'blue';

export const themeColors: Record<ThemeColor, string> = {
    indigo: '#5449e9',
    slate: '#475569',
    rose: '#e11d48',
    amber: '#d97706',
    emerald: '#059669',
    cyan: '#0891b2',
    violet: '#7c3aed',
    fuchsia: '#c026d3',
    orange: '#ea580c',
    blue: '#2563eb',
};

export const useTheme = (userId?: string) => {
    const applyTheme = (color: ThemeColor, mode: ThemeMode) => {
        // Apply color
        const root = document.documentElement;
        root.style.setProperty('--primary', themeColors[color]);

        // Apply mode
        if (mode === 'dark') {
            root.classList.add('dark');
        } else if (mode === 'light') {
            root.classList.remove('dark');
        } else {
            // Auto
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    const fetchAndApplyTheme = async () => {
        try {
            let color: ThemeColor = 'indigo';
            let mode: ThemeMode = 'auto';

            // 1. Try Global Default
            const { data: globalSet } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'DEFAULT_THEME')
                .single();

            if (globalSet?.value) {
                const parsed = typeof globalSet.value === 'string' ? JSON.parse(globalSet.value) : globalSet.value;
                color = parsed.color || color;
                mode = parsed.mode || mode;
            }

            // 2. Try User Personal Preference
            if (userId) {
                const { data: userSet } = await supabase
                    .from('user_settings')
                    .select('value')
                    .eq('user_id', userId)
                    .eq('key', 'THEME_PREFERENCE')
                    .single();

                if (userSet?.value) {
                    const parsed = typeof userSet.value === 'string' ? JSON.parse(userSet.value) : userSet.value;
                    color = parsed.color || color;
                    mode = parsed.mode || mode;
                }
            }

            applyTheme(color, mode);
        } catch (err) {
            console.error('Theme application error:', err);
        }
    };

    useEffect(() => {
        fetchAndApplyTheme();

        // Listen for system theme changes if mode is auto
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => fetchAndApplyTheme();
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [userId]);

    return { refreshTheme: fetchAndApplyTheme };
};
