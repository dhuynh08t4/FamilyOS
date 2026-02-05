import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { themeColors, type ThemeColor, type ThemeMode, useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ThemeSelectorProps {
    userId?: string;
    onClose?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ userId, onClose }) => {
    const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');
    const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
    const { refreshTheme } = useTheme(userId);

    useEffect(() => {
        const fetchTheme = async () => {
            if (!userId) {
                // Fetch Global Default if no user
                const { data } = await supabase.from('app_settings').select('value').eq('key', 'DEFAULT_THEME').single();
                if (data?.value) {
                    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    setThemeColor(parsed.color || 'indigo');
                    setThemeMode(parsed.mode || 'auto');
                }
                return;
            }

            const { data } = await supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'THEME_PREFERENCE').single();
            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setThemeColor(parsed.color || 'indigo');
                setThemeMode(parsed.mode || 'auto');
            }
        };
        fetchTheme();
    }, [userId]);

    const saveTheme = async (color: ThemeColor, mode: ThemeMode) => {
        setThemeColor(color);
        setThemeMode(mode);
        if (!userId) return;

        try {
            await supabase.from('user_settings').upsert({
                user_id: userId,
                key: 'THEME_PREFERENCE',
                value: { color, mode }
            }, { onConflict: 'user_id,key' });
            refreshTheme();
        } catch (err) {
            console.error('Save theme error:', err);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-72">
            <div className="flex items-center gap-2 mb-2">
                <Palette size={18} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">Appearance</h3>
            </div>

            <div className="space-y-4">
                {/* Modes */}
                <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    {[
                        { id: 'light', icon: Sun },
                        { id: 'dark', icon: Moon },
                        { id: 'auto', icon: Monitor }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => saveTheme(themeColor, m.id as ThemeMode)}
                            className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${themeMode === m.id ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <m.icon size={18} />
                        </button>
                    ))}
                </div>

                {/* Colors */}
                <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(themeColors) as ThemeColor[]).map((color) => (
                        <button
                            key={color}
                            onClick={() => saveTheme(color, themeMode)}
                            className={`size-6 rounded-lg transition-all hover:scale-110 flex items-center justify-center ${themeColor === color ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                            style={{ backgroundColor: themeColors[color] }}
                        >
                            {themeColor === color && <Check size={12} className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    Close
                </button>
            )}
        </div>
    );
};
