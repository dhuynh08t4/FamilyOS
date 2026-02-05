import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, Wallet, FileText, MessageSquare, Settings } from 'lucide-react';

const Layout: React.FC = () => {
    const navItems = [
        { to: '/', icon: LayoutGrid, label: 'Home' },
        { to: '/wallet', icon: Wallet, label: 'Wallet' },
        { to: '/notes', icon: FileText, label: 'Notes' },
        { to: '/chat', icon: MessageSquare, label: 'Chat' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex flex-col min-h-screen pb-20 bg-background-light dark:bg-background-dark">
            <main className="flex-1 w-full max-w-md mx-auto">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-8 z-50">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                                }`
                            }
                        >
                            <Icon size={24} />
                            <span className="text-[10px] font-bold">{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
