import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaDesktop, FaPalette, FaCheck, FaGlobe } from 'react-icons/fa';
import { themeColors, type ThemeColor, type ThemeMode, useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ThemeSelectorProps {
    userId?: string;
    onClose?: () => void;
    variant?: 'popup' | 'inline';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ userId, onClose, variant = 'popup' }) => {
    const [themeColor, setThemeColor] = useState<ThemeColor>('indigo');
    const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
    const [isFollowingGlobal, setIsFollowingGlobal] = useState(false);
    const { refreshTheme } = useTheme(userId);

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
            setIsFollowingGlobal(false);
        } else {
            // No personal preference, fetch global to show values
            const { data: globalData } = await supabase.from('app_settings').select('value').eq('key', 'DEFAULT_THEME').single();
            if (globalData?.value) {
                const parsed = typeof globalData.value === 'string' ? JSON.parse(globalData.value) : globalData.value;
                setThemeColor(parsed.color || 'indigo');
                setThemeMode(parsed.mode || 'auto');
            }
            setIsFollowingGlobal(true);
        }
    };

    useEffect(() => {
        fetchTheme();
    }, [userId]);

    const saveTheme = async (color: ThemeColor, mode: ThemeMode) => {
        setThemeColor(color);
        setThemeMode(mode);
        setIsFollowingGlobal(false);
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

    const setGlobal = async () => {
        if (!userId) return;
        try {
            await supabase.from('user_settings').delete().eq('user_id', userId).eq('key', 'THEME_PREFERENCE');
            await fetchTheme();
            refreshTheme();
        } catch (err) {
            console.error('Set global error:', err);
        }
    };

    if (variant === 'inline') {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cấu hình</p>
                    <button
                        onClick={setGlobal}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isFollowingGlobal ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                    >
                        <FaGlobe size={14} />
                        {isFollowingGlobal ? 'Theo gia đình' : 'Dùng mặc định chung'}
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chế độ hiển thị</p>
                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit">
                        {[
                            { id: 'auto', icon: FaDesktop, label: 'Tự động' },
                            { id: 'light', icon: FaSun, label: 'Sáng' },
                            { id: 'dark', icon: FaMoon, label: 'Tối' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => saveTheme(themeColor, m.id as ThemeMode)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${themeMode === m.id ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <m.icon size={16} />
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Màu chủ đạo</p>
                    <div className="flex flex-wrap gap-4">
                        {(Object.keys(themeColors) as ThemeColor[]).map((color) => (
                            <button
                                key={color}
                                onClick={() => saveTheme(color, themeMode)}
                                className={`group relative size-12 rounded-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${themeColor === color ? 'ring-2 ring-primary ring-offset-4 dark:ring-offset-slate-900 shadow-lg' : ''}`}
                                style={{ backgroundColor: themeColors[color].light }}
                                title={color}
                            >
                                {themeColor === color && <FaCheck size={20} className="text-white" />}
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {color}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-72">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FaPalette size={18} className="text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Giao diện</h3>
                </div>
                {userId && (
                    <button
                        onClick={setGlobal}
                        title="Follow family theme"
                        className={`size-8 rounded-lg flex items-center justify-center transition-all ${isFollowingGlobal ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                    >
                        <FaGlobe size={16} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Modes */}
                <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    {[
                        { id: 'light', icon: FaSun },
                        { id: 'dark', icon: FaMoon },
                        { id: 'auto', icon: FaDesktop }
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
                            style={{ backgroundColor: themeColors[color].light }}
                        >
                            {themeColor === color && <FaCheck size={12} className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    Đóng
                </button>
            )}
        </div>
    );
};
