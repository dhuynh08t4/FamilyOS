import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeColor = 'indigo' | 'slate' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'violet' | 'fuchsia' | 'orange' | 'blue';

export const themeColors: Record<ThemeColor, { light: string; dark: string }> = {
    indigo: { light: '#5449e9', dark: '#818cf8' },
    slate: { light: '#475569', dark: '#94a3b8' },
    rose: { light: '#e11d48', dark: '#fb7185' },
    amber: { light: '#d97706', dark: '#fbbf24' },
    emerald: { light: '#059669', dark: '#34d399' },
    cyan: { light: '#06b6d4', dark: '#22d3ee' },
    violet: { light: '#8b5cf6', dark: '#a78bfa' },
    fuchsia: { light: '#d946ef', dark: '#f472b6' },
    orange: { light: '#f97316', dark: '#fb923c' },
    blue: { light: '#3b82f6', dark: '#60a5fa' },
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
        const root = document.documentElement;

        // Determine mode
        let actualMode: 'light' | 'dark' = 'light';
        if (mode === 'dark') {
            actualMode = 'dark';
        } else if (mode === 'auto') {
            actualMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Apply mode class
        if (actualMode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply color based on mode
        const colorValue = themeColors[color][actualMode];
        root.style.setProperty('--primary', colorValue);

        // Set derived colors (transparencies) for better dark mode support
        root.style.setProperty('--primary-muted', actualMode === 'dark' ? `${colorValue}33` : `${colorValue}1A`);

        updateFavicon(colorValue);
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
