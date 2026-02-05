import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ShoppingCart, Bolt, Film, Plus, ScanLine, ChevronDown, Trash2, Loader2, Utensils, Heart, Home, Package, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Transaction, Profile } from '../types';
import { format } from 'date-fns';

const categoryIcons: Record<string, any> = {
    'Groceries': ShoppingCart,
    'Dining Out': Utensils,
    'Utilities': Bolt,
    'Entertainment': Film,
    'Health': Heart,
    'Transport': Home,
    'Kids': Package,
    'Other': MoreHorizontal
};

const Wallet: React.FC = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        fetchData();

        // Subscription for real-time updates
        const channel = supabase
            .channel('public:transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            // 1. Fetch transactions
            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(50);

            if (transData) {
                setTransactions(transData);
                const spent = transData
                    .filter(t => t.type === 'expense')
                    .reduce((acc, curr) => acc + curr.amount, 0);
                setTotalSpent(spent);
            }

            // 2. Fetch profiles for display names
            const { data: profData } = await supabase
                .from('profiles')
                .select('*');

            if (profData) {
                const profMap = profData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, Profile>);
                setProfiles(profMap);
            }

        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) alert(error.message);
    };

    const categoriesBreakdown = Object.keys(categoryIcons).map(cat => {
        const spent = transactions
            .filter(t => t.category === cat && t.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);
        return {
            label: cat,
            amount: spent,
            percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
            icon: categoryIcons[cat]
        };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
            {/* Header */}
            <header className="px-6 py-6 space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm">
                        <Calendar size={16} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">{format(new Date(), 'MMMM yyyy')}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-slate-500 text-sm font-medium">Total Monthly Spending</p>
                    <h1 className="text-4xl font-extrabold tracking-tight">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h1>
                </div>

                <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 flex justify-between items-center border border-primary/10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Monthly Budget</p>
                        <p className="text-xl font-bold">$2,000.00</p>
                    </div>
                    <div className="size-12 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 border-4 border-primary rounded-full" style={{ clipPath: `inset(0 0 ${100 - (totalSpent / 2000 * 100)}% 0)` }}></div>
                        <span className="text-[10px] font-bold text-primary">{Math.round((totalSpent / 2000) * 100)}%</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-8 px-6">
                {/* Category Donut & Legend (Tablet/Desktop friendly) */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Category Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex flex-wrap gap-2">
                            {categoriesBreakdown.map((cat, idx) => (
                                <div key={idx} className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <cat.icon size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{cat.label}</span>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-1">
                                        <span className="text-lg font-bold">${cat.amount.toFixed(0)}</span>
                                        <span className="text-[10px] font-bold text-primary">{cat.percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="mt-2 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${cat.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI Scanning Promo */}
                <button
                    onClick={() => navigate('/scan')}
                    className="w-full relative overflow-hidden bg-primary/10 dark:bg-primary/20 rounded-2xl p-5 flex items-center justify-between border border-primary/20 text-left transition-transform active:scale-[0.98]"
                >
                    <div className="flex-1 pr-12">
                        <p className="text-primary font-bold text-sm">AI Receipt Scanner</p>
                        <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">Snap a photo to automatically log expenses into categories.</p>
                    </div>
                    <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                        <ScanLine size={28} />
                    </div>
                </button>

                {/* Recent Transactions List */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Transactions</h2>
                        <button className="text-xs font-bold text-primary">View All</button>
                    </div>

                    {/* Responsive: Table on Tablet/Desktop, Cards on Mobile */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(t.date), 'MMM dd')}</td>
                                        <td className="px-6 py-4 font-bold text-sm">
                                            {t.note || 'No description'}
                                            {t.image_url && (
                                                <div className="text-[10px] text-primary mt-1 flex items-center gap-1 font-bold">
                                                    <Plus size={10} /> Image attached
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 italic">
                                            {profiles[t.user_id]?.nice_name || '...'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-500' : ''}`}>
                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-3">
                        {transactions.map((t) => {
                            const Icon = categoryIcons[t.category] || MoreHorizontal;
                            return (
                                <div key={t.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[150px]">{t.note || t.category}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profiles[t.user_id]?.nice_name} • {format(new Date(t.date), 'MMM dd')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-500' : ''}`}>
                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </p>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-300 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-28 right-6 z-30 lg:right-12">
                <button className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center transition-transform active:scale-90 lg:size-20">
                    <Plus size={32} />
                </button>
            </div>
        </div>
    );
};

export default Wallet;
