import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Wallet, FileText, MessageSquare, Settings,
    LogOut, User as UserIcon, Bell, Search, Menu, X, ChevronRight, Sparkles, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ThemeSelector } from './ThemeSelector';

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { to: '/', icon: LayoutGrid, label: 'Dashboard' },
        { to: '/wallet', icon: Wallet, label: 'Wallet' },
        { to: '/notes', icon: FileText, label: 'Notes' },
        { to: '/chat', icon: MessageSquare, label: 'Messenger' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Sparkles size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tight dark:text-white">FamilyOS</span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`
                                }
                            >
                                <Icon size={22} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut size={22} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
                            <input
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary h-11"
                                placeholder="Search everything..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsThemeOpen(!isThemeOpen)}
                                className={`size-11 flex items-center justify-center rounded-2xl border transition-all ${isThemeOpen ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm hover:bg-slate-50'}`}
                            >
                                <Palette size={20} />
                            </button>
                            {isThemeOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsThemeOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <ThemeSelector userId={profile?.id} onClose={() => setIsThemeOpen(false)} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                    {profile?.full_name?.[0] || 'U'}
                                </div>
                                <div className="hidden xl:block text-left">
                                    <p className="text-sm font-black dark:text-white leading-tight">{profile?.nice_name || profile?.full_name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile?.role}</p>
                                </div>
                            </button>

                            {/* Profile Popup */}
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                            <p className="text-sm font-black truncate">{profile?.full_name}</p>
                                            <p className="text-xs font-medium text-slate-400">@{profile?.username}</p>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <UserIcon size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold">My Profile</span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                        <button
                                            onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Settings size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold">Settings</span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                        <div className="h-px bg-slate-100 dark:border-slate-800 my-2 mx-4"></div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span className="text-sm font-bold">Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Sparkles size={18} />
                        </div>
                        <span className="text-lg font-black tracking-tight dark:text-white">FamilyOS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsThemeOpen(!isThemeOpen)}
                            className={`size-10 flex items-center justify-center rounded-xl transition-all ${isThemeOpen ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                        >
                            <Palette size={20} />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Theme Selector Overlay */}
                    {isThemeOpen && (
                        <>
                            <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setIsThemeOpen(false)}></div>
                            <div className="fixed top-20 right-6 z-[70] animate-in slide-in-from-top-4 duration-300">
                                <ThemeSelector userId={profile?.id} onClose={() => setIsThemeOpen(false)} />
                            </div>
                        </>
                    )}
                </header>

                {/* Content with Custom Scrollbar */}
                <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] px-6 py-3 shadow-2xl z-50">
                    <div className="flex justify-between items-center">
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-600'}`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default Layout;
