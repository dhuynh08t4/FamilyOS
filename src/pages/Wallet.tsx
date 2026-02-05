import React from 'react';
import { ArrowLeft, Calendar, ShoppingCart, Bolt, Film, Coffee, Plus, ScanLine, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wallet: React.FC = () => {
    const navigate = useNavigate();
    const categories = [
        { label: 'Groceries', percentage: 45, color: 'bg-primary' },
        { label: 'Utilities', percentage: 25, color: 'bg-indigo-400' },
        { label: 'Ent.', percentage: 15, color: 'bg-indigo-300' },
        { label: 'Other', percentage: 15, color: 'bg-indigo-100' },
    ];

    const transactions = [
        {
            id: 1,
            title: 'Whole Foods',
            category: 'Groceries',
            user: 'Sarah',
            amount: -124.50,
            time: '10:45 AM',
            icon: ShoppingCart,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            date: 'Today, Oct 12',
        },
        {
            id: 2,
            title: 'Electric Bill',
            category: 'Utilities',
            user: 'Auto-pay',
            amount: -85.00,
            time: '09:00 AM',
            icon: Bolt,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            date: 'Today, Oct 12',
        },
        {
            id: 3,
            title: 'Netflix',
            category: 'Entertainment',
            user: 'Monthly Subscription',
            amount: -18.00,
            time: 'Oct 11',
            icon: Film,
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            iconColor: 'text-purple-600 dark:text-purple-400',
            date: 'Yesterday, Oct 11',
        },
        {
            id: 4,
            title: 'Starbucks',
            category: 'Dining',
            user: 'Logged by Mike',
            amount: -24.00,
            time: 'Oct 11',
            icon: Coffee,
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            date: 'Yesterday, Oct 11',
        },
    ];

    return (
        <div className="pb-10">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-20 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-slate-800">
                <button className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Family Wallet</h2>
                    <button className="flex items-center gap-1">
                        <span className="text-primary text-xs font-semibold">October 2023</span>
                        <ChevronDown size={14} className="text-primary" />
                    </button>
                </div>
                <button className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <Calendar size={20} className="text-slate-900 dark:text-white" />
                </button>
            </header>

            {/* Summary Analytics Section */}
            <div className="px-4 py-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spent</p>
                            <p className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">$3,450.00</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full mb-1">
                                -12% vs last mo.
                            </span>
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Budget: $4,000</p>
                        </div>
                    </div>

                    {/* Donut Chart & Legend */}
                    <div className="flex items-center gap-8">
                        <div className="relative flex size-32 shrink-0 items-center justify-center">
                            <div
                                className="size-full rounded-full"
                                style={{
                                    background: `conic-gradient(#5449e9 0% 45%, #818cf8 45% 70%, #a5b4fc 70% 85%, #c7d2fe 85% 100%)`
                                }}
                            />
                            <div className="absolute size-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter text-center leading-none">Categorized<br />Spending</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            {categories.map((cat) => (
                                <div key={cat.label} className="flex items-center gap-2">
                                    <div className={`size-3 rounded-full ${cat.color}`}></div>
                                    <p className="text-slate-700 dark:text-slate-300 text-xs font-medium flex-1">{cat.label}</p>
                                    <p className="text-slate-900 dark:text-white text-xs font-bold">{cat.percentage}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-4 space-y-4">
                {/* Aggregating Transactions by Date */}
                {['Today, Oct 12', 'Yesterday, Oct 11'].map((date) => (
                    <div key={date} className="space-y-3">
                        <div className="flex items-center justify-between pt-2">
                            <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider">{date}</h3>
                            <span className="text-slate-400 text-[11px] font-medium">
                                ${transactions.filter(t => t.date === date).reduce((acc, t) => acc + Math.abs(t.amount), 0).toFixed(2)} total
                            </span>
                        </div>
                        {transactions.filter(t => t.date === date).map((tx) => (
                            <div key={tx.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-transform active:scale-95">
                                <div className={`flex items-center justify-center rounded-lg ${tx.iconBg} ${tx.iconColor} size-12 shrink-0`}>
                                    <tx.icon size={24} />
                                </div>
                                <div className="flex flex-col justify-center flex-1">
                                    <p className="text-slate-900 dark:text-white text-base font-bold leading-tight">{tx.title}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{tx.category} • {tx.user}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-900 dark:text-white text-base font-bold tracking-tight">
                                        {tx.amount < 0 ? `-$${Math.abs(tx.amount).toFixed(2)}` : `+$${tx.amount.toFixed(2)}`}
                                    </p>
                                    <p className="text-slate-400 text-[10px]">{tx.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* AI Scanning Promo */}
            <div className="px-4 mt-8 mb-8">
                <button
                    onClick={() => navigate('/scan')}
                    className="w-full relative overflow-hidden bg-primary/10 dark:bg-primary/20 rounded-2xl p-4 flex items-center justify-between border border-primary/20 text-left transition-transform active:scale-[0.98]"
                >
                    <div className="flex-1 pr-12">
                        <p className="text-primary font-bold text-sm">AI Receipt Scanner</p>
                        <p className="text-slate-600 dark:text-slate-300 text-xs">Snap a photo to automatically log expenses into categories.</p>
                    </div>
                    <div className="size-10 bg-primary text-white rounded-lg flex items-center justify-center shrink-0">
                        <ScanLine size={24} />
                    </div>
                </button>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-6 z-30">
                <button className="flex items-center justify-center size-16 bg-primary text-white rounded-full shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform">
                    <Plus size={32} />
                </button>
            </div>
        </div>
    );
};

export default Wallet;
