import React, { useState, useEffect } from 'react';
import {
    FaArrowLeft, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaSpinner, FaPlus, FaQrcode, FaTimesCircle, FaPen, FaSave,
    FaChartLine, FaTrash, FaChevronDown, FaShoppingCart, FaUtensils, FaBolt, FaFilm,
    FaHeartbeat, FaHome, FaChild, FaEllipsisH, FaMoneyBillWave, FaBahai, FaChurch
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Transaction, Profile } from '../types';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

const categoryIcons: Record<string, any> = {
    'Dâng hiến': FaChurch,
    // 'Đi chợ': FaShoppingCart,
    'Ăn uống': FaUtensils,
    'Mua sắm': FaShoppingCart,
    'Nợ': FaBahai,
    'Điện nước': FaBolt,
    'Giải trí': FaFilm,
    'Sức khỏe': FaHeartbeat,
    'Di chuyển': FaHome,
    'Con cái': FaChild,
    'Khác': FaEllipsisH,
    'Thu nhập': FaMoneyBillWave,
    'Thu khác': FaMoneyBillWave
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
        category: 'Đi chợ',
        note: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense' as 'income' | 'expense'
    });
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [saving, setSaving] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter and calculate breakdown inside the component where 'transactions' is available
    const categoriesBreakdown = Object.keys(categoryIcons).map(cat => {
        const spent = transactions
            .filter(t => (t.category === cat || (cat === 'Khác' && !categoryIcons[t.category])) && t.type === 'expense')
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
            const cat = curr.category || 'Khác';
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
    }, [currentDate]);

    const fetchData = async () => {
        try {
            // 1. Fetch transactions
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();

            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false });

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
        if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;

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
            alert('Lỗi khi xóa giao dịch: ' + error.message);
            // Revert if failed
            setTransactions(originalTransactions);
            fetchData();
        }
    };

    const handleEdit = (t: Transaction) => {
        setEditingId(t.id);
        setNewTrans({
            amount: t.amount.toString(),
            category: t.category, // Note: This might need mapping if old categories are in English
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
                category: 'Đi chợ',
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

    const rowSpace = 'px-3 py-2';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
            {/* Header */}
            <header className="px-6 py-6 space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm">
                        <FaArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-full shadow-sm">
                        <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-primary">
                            <FaChevronLeft size={12} />
                        </button>
                        <div className="flex items-center gap-2 px-2">
                            <FaCalendarAlt size={14} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider min-w-[80px] text-center select-none">{format(currentDate, 'MMMM yyyy', { locale: vi })}</span>
                        </div>
                        <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-primary">
                            <FaChevronRight size={12} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -right-10 -top-10 size-64 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 bottom-0 size-32 bg-primary/5 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Số dư khả dụng</span>
                        <h1 className={`text-3xl lg:text-5xl font-black tracking-tighter mb-8 ${totalIncome - totalSpent >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Đã dùng</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="w-full grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng thu nhập</p>
                                <p className="text-sm md:text-xl font-black text-green-500">+${totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng chi tiêu</p>
                                <p className="text-sm md:text-xl font-black text-red-500">-${totalSpent.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-8 px-6">
                {/* Category Breakdown */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Phân tích danh mục</h2>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Income Categories */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                                <FaChartLine size={16} /> Nguồn thu
                            </h3>
                            <div className="flex gap-3">
                                {incomeBreakdownList.length > 0 ? incomeBreakdownList.map((cat: any, idx: number) => (
                                    <div key={idx} className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/20 flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3 ">
                                            <div className="size-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                {cat.icon ? <cat.icon size={20} /> : <FaChartLine size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.label}</p>
                                                <p className="text-lg font-black text-green-600 dark:text-green-400">+${cat.amount.toLocaleString()}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="h-1 w-12 bg-green-200 dark:bg-green-900/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${cat.percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{cat.percentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )) : (
                                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <p className="text-sm text-slate-400 font-medium">Chưa có dữ liệu thu nhập</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expense Categories */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                                <FaShoppingCart size={16} /> Chi tiêu
                            </h3>
                            <div className="grid gap-3 md:grid-cols-2">
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
                                        <p className="text-sm text-slate-400 font-medium">Chưa có dữ liệu chi tiêu</p>
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
                        <p className="text-primary font-bold text-sm">Máy quét hóa đơn AI</p>
                        <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">Chụp ảnh để tự động thống kê chi tiêu.</p>
                    </div>
                    <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                        <FaQrcode size={28} />
                    </div>
                </button>

                {/* Recent Transactions List */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Giao dịch gần đây</h2>
                        <button className="text-xs font-bold text-primary">Xem tất cả</button>
                    </div>

                    {/* Responsive: Table on Tablet/Desktop, Cards on Mobile */}

                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 h-[70vh] overflow-y-auto relative custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className={`${rowSpace} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Ngày</th>
                                    <th className={`${rowSpace} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Mô tả</th>
                                    <th className={`${rowSpace} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Danh mục</th>
                                    <th className={`${rowSpace} text-xs font-bold text-slate-400 uppercase tracking-widest`}>Thành viên</th>
                                    <th className={`${rowSpace} text-xs font-bold text-slate-400 uppercase tracking-widest text-right`}>Số tiền</th>
                                    <th className={`${rowSpace} w-20`}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className={`${rowSpace} text-sm text-slate-500`}>
                                            <div className="flex flex-col">
                                                <span className="text-sm whitespace-nowrap">{format(new Date(t.date), 'dd-MM', { locale: vi })}</span>
                                                <span className="text-xs text-slate-300">{format(new Date(t.date), 'yyyy', { locale: vi })}</span>
                                            </div>
                                        </td>
                                        <td className={`${rowSpace} font-bold text-sm`}>
                                            {t.note || 'Không có mô tả'}
                                            {t.image_url && (
                                                <div className="text-[10px] text-primary mt-1 flex items-center gap-1 font-bold">
                                                    <FaPlus size={10} /> Đính kèm ảnh
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${rowSpace}`}>
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-lg whitespace-nowrap">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className={`${rowSpace} text-sm text-slate-500 italic`}>
                                            {profiles[t.user_id]?.nice_name || '...'}
                                        </td>
                                        <td className={`${rowSpace} text-right font-bold ${t.type} ${t.type === 'income' ? 'text-green-500' : ''}`}>
                                            {t.amount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className={`${rowSpace} text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="text-slate-400 hover:text-primary p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <FaPen size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <FaTrash size={16} />
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
                            const Icon = categoryIcons[t.category] || FaEllipsisH;
                            return (
                                <div key={t.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[150px]">{t.note || t.category}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profiles[t.user_id]?.nice_name} • {format(new Date(t.date), 'MMM dd', { locale: vi })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-500' : ''}`}>
                                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </p>
                                        <div className="flex items-center justify-end gap-2 mt-1">
                                            <button onClick={() => handleEdit(t)} className="text-slate-300 hover:text-primary transition-colors p-1">
                                                <FaPen size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                <FaTrash size={14} />
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
                            category: 'Đi chợ',
                            note: '',
                            date: new Date().toISOString().split('T')[0],
                            type: 'expense'
                        });
                        setIsAddOpen(true);
                    }}
                    className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center transition-transform active:scale-90 lg:size-20"
                >
                    <FaPlus size={32} />
                </button>
            </div>

            {/* Add Transaction Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                        <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-black">{editingId ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}</h2>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <FaTimesCircle size={24} />
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
                                        {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
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
                                        <FaChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                                    placeholder="Thêm ghi chú (tùy chọn)..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                                    value={newTrans.note}
                                    onChange={e => setNewTrans({ ...newTrans, note: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <FaSpinner className="animate-spin" /> : (editingId ? <FaSave size={20} /> : <FaPlus size={20} />)}
                                {editingId ? 'Lưu thay đổi' : 'Lưu giao dịch'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
