import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    FaThLarge, FaWallet, FaStickyNote, FaCommentDots, FaCog,
    FaSignOutAlt, FaUser, FaBell, FaSearch, FaBars, FaTimes, FaChevronRight, FaMagic, FaPalette, FaQrcode, FaChartPie, FaCalendarAlt
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ThemeSelector } from './ThemeSelector';
import AIChatBubble from './AIChatBubble';
import { motion, AnimatePresence } from 'framer-motion';


const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ type: string, label: string, to: string, icon: any }[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const navItems = [
        { to: '/', icon: FaThLarge, label: 'Dashboard' },
        { to: '/wallet', icon: FaWallet, label: 'Ví' },
        { to: '/budget', icon: FaChartPie, label: 'Dự chi' },
        { to: '/scan', icon: FaQrcode, label: 'Quét' },
        { to: '/events', icon: FaCalendarAlt, label: 'Sự kiện' },
        { to: '/notes', icon: FaStickyNote, label: 'Ghi chú' },
        { to: '/chat', icon: FaCommentDots, label: 'Tin nhắn' },
        { to: '/settings', icon: FaCog, label: 'Cài đặt' },
    ];

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) setProfile(data);
            }

            // Fetch all profiles and notes for global search
            // Selecting '*' to ensure we satisfy the Profile[] type
            const [{ data: profiles }, { data: notes }] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('notes').select('id, title, content')
            ]);
            setAllProfiles(profiles || []);
            setAllNotes(notes || []);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const q = searchQuery.toLowerCase();
        const results: typeof searchResults = [];

        // Search Nav
        navItems.forEach(item => {
            if (item.label.toLowerCase().includes(q)) {
                results.push({ type: 'Điều hướng', label: item.label, to: item.to, icon: item.icon });
            }
        });

        // Search Profiles
        allProfiles.forEach(p => {
            if (p.full_name?.toLowerCase().includes(q) || p.nice_name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q)) {
                results.push({ type: 'Thành viên', label: p.nice_name || p.full_name || 'Thành viên', to: '/settings', icon: FaUser });
            }
        });

        // Search Notes
        allNotes.forEach(n => {
            if (n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)) {
                results.push({ type: 'Ghi chú', label: n.title || 'Không tiêu đề', to: '/notes', icon: FaStickyNote });
            }
        });

        setSearchResults(results.slice(0, 8));
    }, [searchQuery, allProfiles, allNotes]);

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
                            <FaMagic size={24} />
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
                        <FaSignOutAlt size={22} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative max-w-md w-full relative">
                            <FaSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
                            <input
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary h-11"
                                placeholder="Tìm kiếm mọi thứ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />

                            {/* Global Search Results Dropdown */}
                            {isSearchFocused && searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-2">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((res, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { navigate(res.to); setSearchQuery(''); }}
                                                    className="w-full p-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group text-left"
                                                >
                                                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <res.icon size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate dark:text-white">{res.label}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{res.type}</p>
                                                    </div>
                                                    <FaChevronRight size={16} className="text-slate-300" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <p className="text-sm text-slate-400 font-medium">Không tìm thấy kết quả cho "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tìm kiếm thông minh toàn cầu</p>
                                        <FaMagic size={14} className="text-primary" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
                            <FaBell size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsThemeOpen(!isThemeOpen)}
                                className={`size-11 flex items-center justify-center rounded-2xl border transition-all ${isThemeOpen ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm hover:bg-slate-50'}`}
                            >
                                <FaPalette size={20} />
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
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden border border-slate-100 dark:border-slate-800">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        profile?.full_name?.[0] || 'U'
                                    )}
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
                                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden border border-slate-100 dark:border-slate-800">
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    profile?.full_name?.[0] || 'U'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black truncate dark:text-white">{profile?.full_name}</p>
                                                <p className="text-xs font-medium text-slate-400">@{profile?.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FaUser size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold">Hồ sơ của tôi</span>
                                            </div>
                                            <FaChevronRight size={14} className="text-slate-300" />
                                        </button>
                                        <button
                                            onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FaCog size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold">Cài đặt</span>
                                            </div>
                                            <FaChevronRight size={14} className="text-slate-300" />
                                        </button>
                                        <div className="h-px bg-slate-100 dark:border-slate-800 my-2 mx-4"></div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
                                        >
                                            <FaSignOutAlt size={18} />
                                            <span className="text-sm font-bold">Đăng xuất</span>
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
                            <FaMagic size={18} />
                        </div>
                        <span className="text-lg font-black tracking-tight dark:text-white">FamilyOS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsThemeOpen(!isThemeOpen)}
                            className={`size-10 flex items-center justify-center rounded-xl transition-all ${isThemeOpen ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                        >
                            <FaPalette size={20} />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                        >
                            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
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
                    <div className="flex justify-between items-center h-14 relative">
                        {/* Dashboard */}
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-primary' : 'text-slate-400'}`
                            }
                        >
                            <FaThLarge size={22} />
                            <span className="text-[10px] font-bold">Dashboard</span>
                        </NavLink>

                        {/* Ví */}
                        <NavLink
                            to="/wallet"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-primary' : 'text-slate-400'}`
                            }
                        >
                            <FaWallet size={22} />
                            <span className="text-[10px] font-bold">Ví</span>
                        </NavLink>

                        {/* Center Scan Button */}
                        <div className="flex-1 flex justify-center -mt-12">
                            <NavLink
                                to="/scan"
                                className={({ isActive }) =>
                                    `size-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform ${isActive ? 'bg-primary scale-110 ring-4 ring-primary/20' : 'bg-gradient-to-tr from-primary to-indigo-500 hover:scale-105 active:scale-95'}`
                                }
                            >
                                <FaQrcode size={32} />
                            </NavLink>
                        </div>

                        {/* Dự chi */}
                        <NavLink
                            to="/budget"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-primary' : 'text-slate-400'}`
                            }
                        >
                            <FaChartPie size={22} />
                            <span className="text-[10px] font-bold">Dự chi</span>
                        </NavLink>

                        {/* Other Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`flex flex-col items-center gap-1 transition-all flex-1 ${isMobileMenuOpen ? 'text-primary' : 'text-slate-400'}`}
                        >
                            <FaBars size={22} />
                            <span className="text-[10px] font-bold">Khác</span>
                        </button>
                    </div>
                </nav>

                {/* Mobile Full Menu Overlay (Left Side Drawer) */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-[80%] max-w-xs bg-white dark:bg-slate-900 shadow-2xl z-[70] lg:hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                            <FaMagic size={24} />
                                        </div>
                                        <span className="text-xl font-black tracking-tight dark:text-white">FamilyOS</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hệ điều hành gia đình</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                                    {navItems.map(({ to, icon: Icon, label }) => (
                                        <NavLink
                                            key={to}
                                            to={to}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${isActive
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`
                                            }
                                        >
                                            <Icon size={22} />
                                            <span>{label}</span>
                                        </NavLink>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <FaSignOutAlt size={22} />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
            <AIChatBubble />
        </div>
    );
};

export default Layout;
