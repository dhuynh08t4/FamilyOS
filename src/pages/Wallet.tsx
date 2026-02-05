import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Trash2, Loader2, Plus, ScanLine, XCircle, Pencil, Save, TrendingUp } from 'lucide-react';
import { FaShoppingCart, FaUtensils, FaBolt, FaFilm, FaHeartbeat, FaHome, FaChild, FaEllipsisH, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Transaction, Profile } from '../types';
import { format } from 'date-fns';

const categoryIcons: Record<string, any> = {
    'Groceries': FaShoppingCart,
    'Dining Out': FaUtensils,
    'Utilities': FaBolt,
    'Entertainment': FaFilm,
    'Health': FaHeartbeat,
    'Transport': FaHome,
    'Kids': FaChild,
    'Other': FaEllipsisH,
    'Income': FaMoneyBillWave
};

const Wallet: React.FC = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTrans, setNewTrans] = useState({
        amount: '',
        category: 'Groceries',
        note: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense' as 'income' | 'expense'
    });
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [saving, setSaving] = useState(false);

    // Filter and calculate breakdown inside the component where 'transactions' is available
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

    const incomeBreakdown = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => {
            const cat = curr.category || 'Other';
            if (!acc[cat]) {
                acc[cat] = {
                    label: cat,
                    amount: 0,
                    icon: categoryIcons[cat] || FaMoneyBillWave
                };
            }
            acc[cat].amount += curr.amount;
            return acc;
        }, {} as Record<string, any>);

    const incomeBreakdownList = Object.values(incomeBreakdown).map((item: any) => ({
        ...item,
        percentage: totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0
    })).sort((a: any, b: any) => b.amount - a.amount);

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

                const income = transData
                    .filter(t => t.type === 'income')
                    .reduce((acc, curr) => acc + curr.amount, 0);
                setTotalIncome(income);
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

    const handleDelete = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        // Optimistic UI update
        const originalTransactions = [...transactions];
        setTransactions(prev => prev.filter(t => t.id !== id));

        // Update local total spent
        const deletedTrans = transactions.find(t => t.id === id);
        if (deletedTrans) {
            if (deletedTrans.type === 'expense') {
                setTotalSpent(prev => prev - deletedTrans.amount);
            } else if (deletedTrans.type === 'income') {
                setTotalIncome(prev => prev - deletedTrans.amount);
            }
        }

        const { error } = await supabase.from('transactions').delete().eq('id', id);

        if (error) {
            alert('Error deleting transaction: ' + error.message);
            // Revert if failed
            setTransactions(originalTransactions);
            fetchData();
        }
    };

    const handleEdit = (t: Transaction) => {
        setEditingId(t.id);
        setNewTrans({
            amount: t.amount.toString(),
            category: t.category,
            note: t.note || '',
            date: t.date,
            type: t.type as 'income' | 'expense'
        });
        setIsAddOpen(true);
    };

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const transactionData = {
                user_id: user.id,
                amount: parseFloat(newTrans.amount),
                category: newTrans.category,
                note: newTrans.note,
                date: newTrans.date,
                type: newTrans.type
            };

            let error;
            if (editingId) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update(transactionData)
                    .eq('id', editingId);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('transactions')
                    .insert(transactionData);
                error = insertError;
            }

            if (error) throw error;

            setIsAddOpen(false);
            setEditingId(null);
            setNewTrans({
                amount: '',
                category: 'Groceries',
                note: '',
                date: new Date().toISOString().split('T')[0],
                type: 'expense'
            });
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

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

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -right-10 -top-10 size-64 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 bottom-0 size-32 bg-primary/5 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Remaining Balance</span>
                        <h1 className={`text-5xl font-black tracking-tighter mb-8 ${totalIncome - totalSpent >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                            ${(totalIncome - totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h1>

                        {/* Circular Progress Chart */}
                        <div className="size-48 relative flex items-center justify-center">
                            {/* Background Track */}
                            <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                                <circle
                                    className="text-slate-100 dark:text-slate-800"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                                {/* Progress Arc */}
                                <circle
                                    className={`transition-all duration-1000 ease-out ${totalIncome - totalSpent < 0 ? 'text-red-500' : 'text-primary'}`}
                                    strokeWidth="8"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - ((totalIncome > 0 ? Math.min(totalSpent / totalIncome, 1) : 1) * 251.2)}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                            </svg>
                            {/* Inner Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">
                                    {totalIncome > 0 ? Math.round((totalSpent / totalIncome) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Used</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="w-full grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Income</p>
                                <p className="text-xl font-black text-green-500">+${totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
                                <p className="text-xl font-black text-red-500">-${totalSpent.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-8 px-6">
                {/* Category Breakdown */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Category Analysis</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Income Categories */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={16} /> Income Sources
                            </h3>
                            <div className="grid gap-3">
                                {incomeBreakdownList.length > 0 ? incomeBreakdownList.map((cat: any, idx: number) => (
                                    <div key={idx} className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/20 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                {cat.icon ? <cat.icon size={20} /> : <TrendingUp size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.label}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="h-1 w-12 bg-green-200 dark:bg-green-900/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${cat.percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{cat.percentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-green-600 dark:text-green-400">+${cat.amount.toLocaleString()}</p>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <p className="text-sm text-slate-400 font-medium">No income data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expense Categories */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                                <FaShoppingCart size={16} /> Expense Breakdown
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {categoriesBreakdown.map((cat, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-32 relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
                                            <cat.icon size={64} />
                                        </div>
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2 relative z-10">
                                            <cat.icon size={16} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-0.5">{cat.label}</p>
                                            <p className="text-lg font-black text-slate-700 dark:text-slate-200">${cat.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="mt-2 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative z-10">
                                            <div className="h-full bg-primary" style={{ width: `${cat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {categoriesBreakdown.length === 0 && (
                                    <div className="col-span-2 p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <p className="text-sm text-slate-400 font-medium">No expenses yet</p>
                                    </div>
                                )}
                            </div>
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
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="text-slate-400 hover:text-primary p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <button onClick={() => handleEdit(t)} className="text-slate-300 hover:text-primary transition-colors p-1">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-28 right-6 z-30 lg:right-12">
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewTrans({
                            amount: '',
                            category: 'Groceries',
                            note: '',
                            date: new Date().toISOString().split('T')[0],
                            type: 'expense'
                        });
                        setIsAddOpen(true);
                    }}
                    className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center transition-transform active:scale-90 lg:size-20"
                >
                    <Plus size={32} />
                </button>
            </div>

            {/* Add Transaction Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-black">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </header>
                        <form onSubmit={handleSaveTransaction} className="p-8 space-y-6">
                            <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                {(['expense', 'income'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setNewTrans({ ...newTrans, type: t })}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${newTrans.type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">$</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-2xl font-black focus:ring-2 focus:ring-primary outline-none"
                                        value={newTrans.amount}
                                        onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary"
                                            value={newTrans.category}
                                            onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}
                                        >
                                            {Object.keys(categoryIcons).map(cat => <option key={cat}>{cat}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                                        value={newTrans.date}
                                        onChange={e => setNewTrans({ ...newTrans, date: e.target.value })}
                                    />
                                </div>

                                <textarea
                                    placeholder="Add a note (optional)..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                                    value={newTrans.note}
                                    onChange={e => setNewTrans({ ...newTrans, note: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : (editingId ? <Save size={20} /> : <Plus size={20} />)}
                                {editingId ? 'Save Changes' : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
