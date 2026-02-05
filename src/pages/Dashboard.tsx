import { Bell, Search, ScanLine, Notebook as Note, MessageSquare, Clock, User, Loader2, Pin, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ spent: 0, budget: 2000 });
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
                .select('amount')
                .eq('type', 'expense')
                .gte('date', startOfMonth.toISOString().split('T')[0]);

            const total = trans?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            setStats(prev => ({ ...prev, spent: total }));

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
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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
                                <User size={24} />
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{greeting}</p>
                        <h1 className="text-lg font-black leading-tight">{profile?.nice_name || profile?.full_name || 'Family Member'}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <Search size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => navigate('/scan')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                            <ScanLine size={28} />
                        </div>
                        <span className="text-xs font-bold">Scan AI</span>
                    </button>
                    <button
                        onClick={() => navigate('/notes')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Note size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">New Note</span>
                    </button>
                    <button
                        onClick={() => navigate('/chat')}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95"
                    >
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">Family Chat</span>
                    </button>
                </div>
            </section>

            {/* Spending Progress Card */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold">Monthly Spending</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-primary">${stats.spent.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">of ${stats.budget.toLocaleString()} limit</p>
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
                            <Clock size={14} /> {30 - new Date().getDate()} days left
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">${Math.max(stats.budget - stats.spent, 0).toLocaleString()} remaining</span>
                    </div>
                </div>
            </section>

            {/* Recent Notes Masonry */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Recent Notes</h2>
                    <button onClick={() => navigate('/notes')} className="text-primary text-sm font-bold active:opacity-70">View All</button>
                </div>
                <div className="columns-2 gap-3 space-y-3">
                    {recentNotes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => navigate('/notes')}
                            className="break-inside-avoid bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm line-clamp-1">{note.title || 'Untitled'}</h4>
                                {note.is_pinned && <Pin size={12} className="text-primary fill-primary" />}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                {note.content || 'No content...'}
                            </p>
                        </div>
                    ))}
                    {recentNotes.length === 0 && (
                        <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-400 font-medium">No notes yet. Create one!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Global Activity Feed */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold">Family Activity</h2>
                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                    {activities.map((act) => (
                        <div key={`${act.activityType}-${act.id}`} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${act.activityType === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {act.activityType === 'message' ? <MessageSquare size={20} /> : <Wallet size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">
                                    <span className="text-primary">{act.profiles?.nice_name || act.profiles?.full_name}</span>
                                    {act.activityType === 'message' ? ' sent a message' : ` spent $${act.amount}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic truncate">
                                    {act.activityType === 'message' ? act.content : act.note || act.category}
                                </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                                {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="p-8 text-center">
                            <p className="text-xs text-slate-400">No activity today yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
