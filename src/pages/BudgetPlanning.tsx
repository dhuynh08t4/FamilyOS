import React, { useState, useEffect } from 'react';
import {
    FaArrowLeft, FaPlus, FaSpinner, FaTrash,
    FaEdit, FaSave, FaTimes, FaFilter, FaCheckCircle, FaEye,
    FaChurch, FaUtensils, FaShoppingCart, FaBahai, FaBolt, FaFilm,
    FaHeartbeat, FaHome, FaChild, FaEllipsisH, FaMoneyBillWave,
    FaUnlink
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { BudgetPlan, Transaction } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { useDialog } from '../components/ui/DialogProvider';
import { subDays, subMonths, subYears, isAfter, parseISO, format } from 'date-fns';


type FilterType = '1_week' | '30_days' | '6_months' | '1_year' | 'all';

const categoryIcons: Record<string, any> = {
    'Dâng hiến': FaChurch,
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

const BudgetPlanning: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useDialog();
    const [plans, setPlans] = useState<BudgetPlan[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Creation State
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanAmount, setNewPlanAmount] = useState('');
    const [newPlanCategory, setNewPlanCategory] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Filter State
    const [filterType, setFilterType] = useState<FilterType>('30_days');

    // Inline editing states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'archived'>('active');
    const [editCategory, setEditCategory] = useState('');

    // View Details State
    const [viewingPlan, setViewingPlan] = useState<BudgetPlan | null>(null);

    // Transaction Creation in Modal
    const [newTransAmount, setNewTransAmount] = useState('');
    const [newTransCategory, setNewTransCategory] = useState('');
    const [newTransDate, setNewTransDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTransNote, setNewTransNote] = useState('');
    const [isAddingTrans, setIsAddingTrans] = useState(false);
    const [isLinkingTrans, setIsLinkingTrans] = useState(false);
    const [linkSearchQuery, setLinkSearchQuery] = useState('');
    const [transactionToRemove, setTransactionToRemove] = useState<Transaction | null>(null);

    const tableSpace = 'px-2 py-1';

    useEffect(() => {
        fetchData();

        // Subscribe to changes
        const channel = supabase
            .channel('budget_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_plans' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
            .subscribe();

        const handleRefresh = () => fetchData();
        window.addEventListener('family-os-refresh', handleRefresh);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('family-os-refresh', handleRefresh);
        };
    }, []);

    // Sync editing state when viewing a plan
    useEffect(() => {
        if (viewingPlan) {
            setEditName(viewingPlan.name);
            setEditAmount(viewingPlan.planned_amount.toString());
            setEditCategory(viewingPlan.category || '');
            setNewTransCategory(viewingPlan.category || '');
            setEditingId(null); // Clear list editing state to avoid conflicts
        }
    }, [viewingPlan]);

    const fetchData = async () => {
        try {
            // Fetch Plans
            const { data: plansData, error: plansError } = await supabase
                .from('budget_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (plansError) throw plansError;

            // Fetch Transactions associated with plans
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (transError) throw transError;

            setPlans(plansData || []);
            setTransactions(transData || []);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) return;
        setIsCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('budget_plans').insert({
                user_id: user.id,
                name: newPlanName,
                planned_amount: parseFloat(newPlanAmount) || 0,
                category: newPlanCategory,
                status: 'active'
            });

            if (error) throw error;
            setNewPlanName('');
            setNewPlanAmount('');
            setNewPlanCategory('');
            showToast('Đã tạo khoản dự chi mới', 'success');
        } catch (error: any) {
            showToast('Lỗi khi tạo dự chi: ' + error.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const startEditing = (plan: BudgetPlan) => {
        setEditingId(plan.id);
        setEditName(plan.name);
        setEditAmount(plan.planned_amount.toString());
        setEditStatus(plan.status);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditAmount('');
    };

    const saveEditing = async (id: string, updates: Partial<BudgetPlan> = {}) => {
        const nameToSave = updates.name !== undefined ? updates.name : editName;
        const amountToSave = updates.planned_amount !== undefined ? updates.planned_amount : parseFloat(editAmount) || 0;
        const statusToSave = updates.status !== undefined ? updates.status : editStatus;
        const categoryToSave = updates.category !== undefined ? updates.category : editCategory;

        try {
            const { error } = await supabase.from('budget_plans').update({
                name: nameToSave,
                planned_amount: amountToSave,
                status: statusToSave,
                category: categoryToSave
            }).eq('id', id);

            if (error) throw error;
            setEditingId(null);
            showToast('Đã cập nhật dự chi', 'success');

            // Update viewingPlan logic if needed
            if (viewingPlan && viewingPlan.id === id) {
                setViewingPlan(prev => prev ? ({ ...prev, name: nameToSave, planned_amount: amountToSave, status: statusToSave, category: categoryToSave }) : null);
            }
        } catch (error: any) {
            showToast('Lỗi khi cập nhật dự chi: ' + error.message, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Xóa dự chi',
            message: 'Bạn có chắc chắn muốn xóa khoản dự chi này? Các giao dịch sẽ được giữ lại nhưng không còn liên kết.',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            const { error } = await supabase.from('budget_plans').delete().eq('id', id);
            if (error) throw error;
            showToast('Đã xóa khoản dự chi', 'success');
            if (viewingPlan?.id === id) setViewingPlan(null);
        } catch (error: any) {
            showToast('Lỗi khi xóa dự chi: ' + error.message, 'error');
        }
    };

    const getPlanProgress = (planId: string) => {
        const spent = transactions
            .filter(t => t.budget_plan_id === planId)
            .reduce((acc, curr) => acc + curr.amount, 0);
        return spent;
    };

    const handleComplete = async (plan: BudgetPlan) => {
        const actual = getPlanProgress(plan.id);
        const diff = plan.planned_amount - actual;

        if (Math.abs(diff) > 0) {
            const isDeficit = diff < 0; // planned < actual (Over spent)
            const diffAbs = Math.abs(diff).toLocaleString();

            const confirmed = await confirm({
                title: 'Xác nhận hoàn thành',
                message: isDeficit
                    ? `Khoản này đã chi vượt mức ${diffAbs}. Bạn có chắc chắn muốn đánh dấu hoàn thành ? `
                    : `Khoản này vẫn còn dư ${diffAbs}. Bạn có chắc chắn muốn hủy số dư và đánh dấu hoàn thành ? `,
                confirmText: 'Hoàn thành',
                cancelText: 'Xem lại',
                type: 'danger'
            });

            if (!confirmed) return;
        }

        // Proceed to complete
        // We can reuse saveEditing logic logic or direct update
        try {
            // If we were editing, stop editing
            if (editingId === plan.id) cancelEditing();

            const { error } = await supabase.from('budget_plans').update({
                status: 'completed'
            }).eq('id', plan.id);

            if (error) throw error;
            showToast('Đã hoàn thành khoản dự chi', 'success');
        } catch (error: any) {
            showToast('Lỗi khi cập nhật status: ' + error.message, 'error');
        }
    };

    const handleAddTransaction = async () => {
        if (!viewingPlan || !newTransAmount) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                amount: parseFloat(newTransAmount),
                category: newTransCategory || 'Khác',
                note: newTransNote,
                date: newTransDate ? new Date(newTransDate).toISOString() : new Date().toISOString(),
                budget_plan_id: viewingPlan.id,
                type: 'expense'
            });

            if (error) throw error;

            setNewTransAmount('');
            setNewTransCategory('');
            setNewTransDate(new Date().toISOString().split('T')[0]);
            setNewTransNote('');
            setIsAddingTrans(false);
            showToast('Đã thêm giao dịch', 'success');
        } catch (error: any) {
            showToast('Lỗi khi thêm giao dịch: ' + error.message, 'error');
        }
    };

    const handleLinkTransaction = async (transId: string | number) => {
        if (!viewingPlan) return;
        try {
            const { error } = await supabase.from('transactions').update({
                budget_plan_id: viewingPlan.id
            }).eq('id', transId);

            if (error) throw error;
            showToast('Đã liên kết giao dịch', 'success');
        } catch (error: any) {
            showToast('Lỗi khi liên kết: ' + error.message, 'error');
        }
    };

    // Derived State
    const activePlans = plans.filter(p => p.status === 'active');

    const completedPlans = plans.filter(p => {
        if (p.status !== 'completed') return false;

        if (filterType === 'all') return true;

        const date = parseISO(p.created_at);
        const now = new Date();

        if (filterType === '1_week') return isAfter(date, subDays(now, 7));
        if (filterType === '30_days') return isAfter(date, subDays(now, 30));
        if (filterType === '6_months') return isAfter(date, subMonths(now, 6));
        if (filterType === '1_year') return isAfter(date, subYears(now, 1));

        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const TableRow = ({ plan, isCompleted = false }: { plan: BudgetPlan, isCompleted?: boolean }) => {
        const actual = getPlanProgress(plan.id);
        const progress = plan.planned_amount > 0 ? (actual / plan.planned_amount) * 100 : 0;
        const isEditing = editingId === plan.id;

        return (
            <tr
                onDoubleClick={() => setViewingPlan(plan)}
                className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-none cursor-pointer"
            >
                <td className={`${tableSpace} font - bold text - sm`}>
                    {isEditing ? (
                        <input
                            className="w-full bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : plan.name}
                </td>
                <td className={`${tableSpace} `}>
                    {isEditing ? (
                        <select
                            className="w-full bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary appearance-none"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">Chọn danh mục</option>
                            {Object.keys(categoryIcons).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-slate-500 text-sm flex items-center gap-2">
                            {plan.category ? (
                                <>
                                    {React.createElement(categoryIcons[plan.category] || FaEllipsisH, { className: 'text-slate-400' })}
                                    <span>{plan.category}</span>
                                </>
                            ) : '-'}
                        </div>
                    )}
                </td>
                <td className={`${tableSpace} text-sm font-medium text-right`}>
                    {isEditing ? (
                        <input
                            type="number"
                            className="w-32 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary text-right"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-slate-500">${plan.planned_amount.toLocaleString()}</span>
                    )}
                </td>
                <td className={`${tableSpace} text-sm font-bold text-right text-slate-700 dark:text-slate-200`}>
                    ${actual.toLocaleString()}
                </td>
                <td className={`${tableSpace}`}>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </td>
                <td className={`${tableSpace}`}>
                    {isEditing ? (
                        <select
                            className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded outline-none text-xs font-bold"
                            value={editStatus}
                            onChange={(e: any) => setEditStatus(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="active">Đang chạy</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="archived">Lưu trữ</option>
                        </select>
                    ) : (
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${plan.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            plan.status === 'archived' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                                'bg-primary/10 text-primary'
                            }`}>
                            {plan.status === 'active' ? 'Đang chạy' :
                                plan.status === 'completed' ? 'Hoàn thành' : 'Lưu trữ'}
                        </span>
                    )}
                </td>
                <td className={`${tableSpace} text-right`}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); saveEditing(plan.id); }} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"><FaSave /></button>
                                <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FaTimes /></button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewingPlan(plan); }}
                                    title="Xem chi tiết"
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <FaEye />
                                </button>
                                {!isCompleted && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleComplete(plan);
                                        }}
                                        title="Đánh dấu hoàn thành"
                                        className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    >
                                        <FaCheckCircle />
                                    </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); startEditing(plan); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><FaEdit /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FaTrash /></button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const PlanCard = ({ plan, isCompleted = false }: { plan: BudgetPlan, isCompleted?: boolean }) => {
        const actual = getPlanProgress(plan.id);
        const progress = plan.planned_amount > 0 ? (actual / plan.planned_amount) * 100 : 0;
        const isEditing = editingId === plan.id;

        return (
            <div
                onDoubleClick={() => setViewingPlan(plan)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4 active:scale-[0.98] transition-all cursor-pointer"
            >
                {/* Header (Name & Actions) */}
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 font-bold text-lg">
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    className="w-full bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Tên kế hoạch"
                                />
                                <select
                                    className="w-full bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm font-normal appearance-none"
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="">Chọn danh mục</option>
                                    {Object.keys(categoryIcons).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <div>{plan.name}</div>
                                {plan.category && (
                                    <div className="flex items-center gap-1.5 text-xs font-normal text-slate-500 mt-1">
                                        {React.createElement(categoryIcons[plan.category] || FaEllipsisH, { className: 'text-slate-400' })}
                                        <span>{plan.category}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dự kiến</p>
                        {isEditing ? (
                            <input
                                type="number"
                                className="w-full bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-primary font-medium mt-1"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className="text-slate-500 font-medium text-lg">${plan.planned_amount.toLocaleString()}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thực tế</p>
                        <p className="font-bold text-lg text-slate-700 dark:text-slate-200">${actual.toLocaleString()}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Tiến độ</span>
                        <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer (Status & Actions) */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isEditing ? (
                        <select
                            className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded outline-none text-xs font-bold"
                            value={editStatus}
                            onChange={(e: any) => setEditStatus(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="active">Đang chạy</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="archived">Lưu trữ</option>
                        </select>
                    ) : (
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${plan.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            plan.status === 'archived' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                                'bg-primary/10 text-primary'
                            }`}>
                            {plan.status === 'active' ? 'Đang chạy' :
                                plan.status === 'completed' ? 'Hoàn thành' : 'Lưu trữ'}
                        </span>
                    )}

                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); saveEditing(plan.id); }} className="p-2 bg-green-50 text-green-600 rounded-lg"><FaSave /></button>
                                <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-2 bg-red-50 text-red-600 rounded-lg"><FaTimes /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); setViewingPlan(plan); }} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg"><FaEye /></button>
                                {!isCompleted && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleComplete(plan);
                                        }}
                                        className="p-2 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-lg"
                                    >
                                        <FaCheckCircle />
                                    </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); startEditing(plan); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg"><FaEdit /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg"><FaTrash /></button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    };

    const handleRemoveTransaction = (transaction: Transaction) => {
        setTransactionToRemove(transaction);
    };

    const executeUnlink = async () => {
        if (!transactionToRemove) return;
        try {
            const { error } = await supabase.from('transactions').update({
                budget_plan_id: null
            }).eq('id', transactionToRemove.id);

            if (error) throw error;
            showToast('Đã gỡ liên kết giao dịch', 'success');
            setTransactionToRemove(null);
            setTransactions(prev => prev.map(t => t.id === transactionToRemove.id ? { ...t, budget_plan_id: null } : t));
        } catch (error: any) {
            showToast('Lỗi khi gỡ liên kết: ' + error.message, 'error');
        }
    };

    const executeDelete = async () => {
        if (!transactionToRemove) return;
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', transactionToRemove.id);

            if (error) throw error;
            showToast('Đã xóa giao dịch vĩnh viễn', 'success');
            setTransactionToRemove(null);
            setTransactions(prev => prev.filter(t => t.id !== transactionToRemove.id));
        } catch (error: any) {
            showToast('Lỗi khi xóa giao dịch: ' + error.message, 'error');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
            <header className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                        <FaArrowLeft size={16} />
                    </button>
                    <h1 className="text-xl font-bold">Dự chi Ngân sách</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">

                {/* Active Plans Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            Đang chạy
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">{activePlans.length}</span>
                        </h2>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr className="min-h-12 whitespace-nowrap">
                                        <th className={`${tableSpace} min-w-48 py-4 pl-3`}>Tên khoản mục</th>
                                        <th className={`${tableSpace}`}>Danh mục</th>
                                        <th className={`${tableSpace} text-right`}>Dự kiến</th>
                                        <th className={`${tableSpace} text-right`}>Thực tế</th>
                                        <th className={`${tableSpace} w-48`}>Tiến độ</th>
                                        <th className={`${tableSpace} w-32`}>Trạng thái</th>
                                        <th className={`${tableSpace} w-32 text-right`}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activePlans.map(plan => (
                                        <TableRow key={plan.id} plan={plan} />
                                    ))}

                                    {/* Inline Creation Row */}
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-t-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <td className={`${tableSpace}`}>
                                            <input
                                                type="text"
                                                placeholder="Thêm khoản dự chi mới..."
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 focus:placeholder:text-slate-300"
                                                value={newPlanName}
                                                onChange={(e) => setNewPlanName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
                                            />
                                        </td>
                                        <td className={`${tableSpace}`}>
                                            <select
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 focus:placeholder:text-slate-300"
                                                value={newPlanCategory}
                                                onChange={(e) => setNewPlanCategory(e.target.value)}
                                            >
                                                <option value="">Danh mục...</option>
                                                {Object.keys(categoryIcons).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className={`${tableSpace}`}>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-transparent border-none outline-none text-sm font-medium text-right placeholder:text-slate-400"
                                                value={newPlanAmount}
                                                onChange={(e) => setNewPlanAmount(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
                                            />
                                        </td>
                                        <td colSpan={3}></td>
                                        <td className={`${tableSpace} text-right`}>
                                            <button
                                                onClick={handleCreatePlan}
                                                disabled={!newPlanName.trim() || isCreating}
                                                className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                                            >
                                                {isCreating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {/* Creation Card */}
                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tạo mới</h3>
                            <input
                                type="text"
                                placeholder="Tên khoản dự chi..."
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                            />
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary appearance-none"
                                value={newPlanCategory}
                                onChange={(e) => setNewPlanCategory(e.target.value)}
                            >
                                <option value="">Chọn danh mục...</option>
                                {Object.keys(categoryIcons).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Số tiền dự kiến..."
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                    value={newPlanAmount}
                                    onChange={(e) => setNewPlanAmount(e.target.value)}
                                />
                                <button
                                    onClick={handleCreatePlan}
                                    disabled={!newPlanName.trim() || isCreating}
                                    className="px-6 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isCreating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                </button>
                            </div>
                        </div>

                        {/* List of active plans */}
                        {activePlans.map(plan => (
                            <PlanCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </section>

                {/* Completed Plans Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-400">Đã hoàn thành</h2>

                        {/* Filter Dropdown */}
                        <div className="relative group">
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm hover:border-slate-300 transition-colors">
                                <FaFilter size={12} className="text-slate-400" />
                                <span className="capitalize">{filterType.replace('_', ' ')}</span>
                            </div>
                            <select
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as FilterType)}
                            >
                                <option value="1_week">1 Tuần</option>
                                <option value="30_days">30 Ngày</option>
                                <option value="6_months">6 Tháng</option>
                                <option value="1_year">1 Năm</option>
                                <option value="all">Tất cả</option>
                            </select>
                        </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <tr className="min-h-12 whitespace-nowrap">
                                        <th className={`${tableSpace} min-w-48 py-4 pl-3`}>Tên khoản mục</th>
                                        <th className={`${tableSpace} text-right`}>Dự kiến</th>
                                        <th className={`${tableSpace} text-right`}>Thực tế</th>
                                        <th className={`${tableSpace} w-48`}>Tiến độ</th>
                                        <th className={`${tableSpace} w-32`}>Trạng thái</th>
                                        <th className={`${tableSpace} w-32 text-right`}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className={`${tableSpace} text-center text-slate-400 italic`}>
                                                Không có khoản dự chi nào đã hoàn thành trong thời gian này.
                                            </td>
                                        </tr>
                                    ) : (
                                        completedPlans.map(plan => (
                                            <TableRow key={plan.id} plan={plan} isCompleted={true} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {completedPlans.length === 0 ? (
                            <div className="text-center text-slate-400 italic py-8">
                                Không có khoản dự chi nào đã hoàn thành.
                            </div>
                        ) : (
                            completedPlans.map(plan => (
                                <PlanCard key={plan.id} plan={plan} isCompleted={true} />
                            ))
                        )}
                    </div>
                </section>

                {/* Transaction Detail & Edit Modal */}
                {viewingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                            <header className={`${tableSpace} flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50`}>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chi tiết & Sửa đổi</h3>
                                </div>
                                <button onClick={() => setViewingPlan(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                    <FaTimes size={24} />
                                </button>
                            </header>

                            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-4">
                                {/* Editable Header Stats */}
                                <div className="flex flex-col gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 ">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tên dự chi</p>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <input
                                                className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 -ml-2 px-2 py-1 rounded-lg outline-none focus:bg-slate-100 dark:focus:bg-slate-700 focus:ring-2 focus:ring-primary transition-all"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onBlur={() => saveEditing(viewingPlan.id, { name: editName })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                            />
                                        </h2>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 px-2 py-1.5 rounded-lg outline-none text-sm mt-3 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-700 transition-all font-medium"
                                            value={editCategory}
                                            onChange={(e) => {
                                                setEditCategory(e.target.value);
                                                saveEditing(viewingPlan.id, { category: e.target.value });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="">Thêm danh mục...</option>
                                            {Object.keys(categoryIcons).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-right">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap text-left">Dự kiến</p>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 -ml-2 px-2 py-1 rounded-lg outline-none font-black text-lg mt-1 focus:bg-slate-100 dark:focus:bg-slate-700 focus:ring-2 focus:ring-primary transition-all text-left"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    onBlur={() => saveEditing(viewingPlan.id, { planned_amount: parseFloat(editAmount) || 0 })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 whitespace-nowrap uppercase">Thực tế</p>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 -ml-2 px-2 py-1 rounded-lg outline-none font-black text-lg mt-1 focus:bg-slate-100 dark:focus:bg-slate-700 focus:ring-2 focus:ring-primary transition-all text-right"
                                                    value={getPlanProgress(viewingPlan.id)}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Transaction Buttons */}
                                <div>
                                    {!isAddingTrans && !isLinkingTrans ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setIsAddingTrans(true)}
                                                className="py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaPlus /> Thêm giao dịch mới
                                            </button>
                                            <button
                                                onClick={() => setIsLinkingTrans(true)}
                                                className="py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaFilter /> Liên kết giao dịch có sẵn
                                            </button>
                                        </div>
                                    ) : isLinkingTrans ? (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-sm">Liên kết giao dịch có sẵn</h4>
                                                <button onClick={() => setIsLinkingTrans(false)} className="text-slate-400 hover:text-red-500"><FaTimes /></button>
                                            </div>

                                            {/* Search Input */}
                                            <div className="relative mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm giao dịch..."
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                                                    value={linkSearchQuery}
                                                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                            </div>

                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {transactions.filter(t =>
                                                    !t.budget_plan_id &&
                                                    t.type === 'expense' &&
                                                    (t.note?.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                                        t.category.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                                        t.amount.toString().includes(linkSearchQuery))
                                                ).length === 0 ? (
                                                    <p className="text-center text-slate-400 text-sm italic py-4">Không có giao dịch chi nào chưa được liên kết.</p>
                                                ) : (
                                                    transactions.filter(t =>
                                                        !t.budget_plan_id &&
                                                        t.type === 'expense' &&
                                                        (t.note?.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                                            t.category.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                                                            t.amount.toString().includes(linkSearchQuery))
                                                    ).map(t => (
                                                        <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                            <div>
                                                                <p className="font-bold text-sm">{t.category} - <span className="text-red-500">-${t.amount.toLocaleString()}</span></p>
                                                                <p className="text-xs text-slate-500">{format(parseISO(t.date), 'dd/MM/yyyy')} {t.note ? `- ${t.note}` : ''}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleLinkTransaction(t.id)}
                                                                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:opacity-80"
                                                                title="Liên kết"
                                                            >
                                                                <FaPlus size={12} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-sm">Thêm giao dịch mới</h4>
                                                <button onClick={() => setIsAddingTrans(false)} className="text-slate-400 hover:text-red-500"><FaTimes /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <input
                                                    type="number"
                                                    placeholder="Số tiền..."
                                                    className="col-span-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                                                    value={newTransAmount}
                                                    onChange={(e) => setNewTransAmount(e.target.value)}
                                                    autoFocus
                                                />
                                                <input
                                                    type="date"
                                                    className="col-span-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                                    value={newTransDate}
                                                    onChange={(e) => setNewTransDate(e.target.value)}
                                                />
                                                <select
                                                    className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary appearance-none"
                                                    value={newTransCategory}
                                                    onChange={(e) => setNewTransCategory(e.target.value)}
                                                >
                                                    <option value="">Chọn danh mục...</option>
                                                    {Object.keys(categoryIcons).map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Ghi chú (tùy chọn)..."
                                                    className="col-span-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                                                    value={newTransNote}
                                                    onChange={(e) => setNewTransNote(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTransaction()}
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddTransaction}
                                                disabled={!newTransAmount}
                                                className="w-full py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50"
                                            >
                                                Lưu giao dịch
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Ngày</th>
                                            <th className="px-4 py-3">Danh mục</th>
                                            <th className="px-4 py-3">Ghi chú</th>
                                            <th className="px-4 py-3 text-right">Số tiền</th>
                                            <th className="px-4 py-3 rounded-r-lg w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.filter(t => t.budget_plan_id === viewingPlan.id).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                                    Chưa có giao dịch nào cho khoản này.
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions
                                                .filter(t => t.budget_plan_id === viewingPlan.id)
                                                .map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-500">
                                                            {format(parseISO(t.date), 'dd/MM/yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold">
                                                            {t.category}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 line-clamp-1 max-w-[200px]">
                                                            {t.note || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-right text-red-500">
                                                            -${t.amount.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleRemoveTransaction(t)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Gỡ bỏ / Xóa"
                                                            >
                                                                <FaUnlink size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Transaction Removal Dialog */}
            {transactionToRemove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold mb-2">Xử lý giao dịch</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Bạn muốn làm gì với giao dịch <span className="font-bold text-slate-800 dark:text-slate-200">{transactionToRemove.note || transactionToRemove.category}</span> ({transactionToRemove.amount.toLocaleString()}đ)?
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={executeUnlink}
                                className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <FaUnlink /> Chỉ gỡ liên kết (Giữ giao dịch)
                            </button>

                            <button
                                onClick={executeDelete}
                                className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <FaTrash /> Xóa giao dịch vĩnh viễn
                            </button>

                            <button
                                onClick={() => setTransactionToRemove(null)}
                                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 rounded-xl font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetPlanning;
