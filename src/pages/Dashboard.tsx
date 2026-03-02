import { FaBell, FaSearch, FaQrcode, FaStickyNote, FaCommentDots, FaClock, FaUser, FaSpinner, FaThumbtack, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { formatDateLocal } from '../utils/date';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ spent: 0, budget: 0 });
    const [recentNotes, setRecentNotes] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Profile
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(prof);

            // 2. Spending
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: trans } = await supabase
                .from('transactions')
                .select('amount, type')
                .gte('date', formatDateLocal(startOfMonth));

            const spentTotal = trans?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            const incomeTotal = trans?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            setStats({ spent: spentTotal, budget: incomeTotal });

            // 3. Notes
            const { data: notes } = await supabase
                .from('notes')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(4);
            setRecentNotes(notes || []);

            // 4. Activities (Messages + Transactions)
            const [msgs, recentTrans] = await Promise.all([
                supabase.from('messages').select('*, profiles(full_name, nice_name)').order('created_at', { ascending: false }).limit(3),
                supabase.from('transactions').select('*, profiles(full_name, nice_name)').order('created_at', { ascending: false }).limit(3)
            ]);

            const combined = [
                ...(msgs.data || []).map(m => ({ ...m, activityType: 'message' })),
                ...(recentTrans.data || []).map(t => ({ ...t, activityType: 'transaction' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

            setActivities(combined);

            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    return (
        <div className="px-4 py-4 space-y-6">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-105"
                            onClick={() => navigate('/settings')}>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <FaUser size={24} />
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{greeting}</p>
                        <h1 className="text-lg font-black leading-tight">{profile?.nice_name || profile?.full_name || 'Thành viên gia đình'}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <FaBell size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <FaSearch size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Tác vụ nhanh</h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => navigate('/scan')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                            <FaQrcode size={28} />
                        </div>
                        <span className="text-xs font-bold">Quét AI</span>
                    </button>
                    <button
                        onClick={() => navigate('/notes')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FaStickyNote size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">Ghi chú</span>
                    </button>
                    <button
                        onClick={() => navigate('/chat')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FaCommentDots size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">Trò chuyện</span>
                    </button>
                </div>
            </section>

            {/* Spending Progress Card */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold">Chi tiêu tháng</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-primary">${stats.spent.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">trong hạn mức ${stats.budget.toLocaleString()}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((stats.spent / stats.budget) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                            <FaClock size={14} /> còn {30 - new Date().getDate()} ngày
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">còn lại ${Math.max(stats.budget - stats.spent, 0).toLocaleString()}</span>
                    </div>
                </div>
            </section>

            {/* Recent Notes Masonry */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Ghi chú gần đây</h2>
                    <button onClick={() => navigate('/notes')} className="text-primary text-sm font-bold active:opacity-70">Xem tất cả</button>
                </div>
                <div className="columns-2 gap-3 space-y-3">
                    {recentNotes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => navigate('/notes')}
                            className="break-inside-avoid bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm line-clamp-1">{note.title || 'Không tiêu đề'}</h4>
                                {note.is_pinned && <FaThumbtack size={12} className="text-primary fill-primary" />}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                {note.content || 'Không có nội dung...'}
                            </p>
                        </div>
                    ))}
                    {recentNotes.length === 0 && (
                        <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-400 font-medium">Chưa có ghi chú nào. Hãy tạo mới!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Global Activity Feed */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold">Hoạt động gia đình</h2>
                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {activities.map((act) => (
                        <div key={`${act.activityType}-${act.id}`} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${act.activityType === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {act.activityType === 'message' ? <FaCommentDots size={20} /> : <FaWallet size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">
                                    <span className="text-primary">{act.profiles?.nice_name || act.profiles?.full_name}</span>
                                    {act.activityType === 'message' ? ' đã gửi tin nhắn' : ` đã chi $${act.amount}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic truncate">
                                    {act.activityType === 'message' ? act.content : act.note || act.category}
                                </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                                {new Date(act.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-xs text-slate-400">Chưa có hoạt động nào hôm nay.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
