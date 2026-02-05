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
    cyan: '#06b6d4',
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
    orange: '#f97316',
    blue: '#3b82f6',
};

const updateFavicon = (color: string) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="${color}"/>
      <path d="M16 7L14.5 12.5L9 14L14.5 15.5L16 21L17.5 15.5L23 14L17.5 12.5L16 7Z" fill="white"/>
      <path d="M8 6V10M6 8H10" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M24 22V26M22 24H26" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `.trim();

    const encoded = encodeURIComponent(svg);
    const dataUri = `data:image/svg+xml,${encoded}`;

    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = dataUri;
};

export const useTheme = (userId?: string) => {
    const applyTheme = (color: ThemeColor, mode: ThemeMode) => {
        // Apply color
        const root = document.documentElement;
        const colorValue = themeColors[color];
        root.style.setProperty('--primary', colorValue);
        updateFavicon(colorValue);

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
