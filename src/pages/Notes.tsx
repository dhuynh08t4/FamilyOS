import React, { useState, useEffect } from 'react';
import { FaSearch, FaThumbtack, FaPlus, FaThLarge, FaList, FaClock, FaFilter, FaTimesCircle, FaSpinner, FaTrash, FaSave } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Note } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const Notes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState<Note | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotes();
        const subscription = supabase
            .channel('public:notes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes())
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const fetchNotes = async () => {
        const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
        if (data) setNotes(data);
        setLoading(false);
    };

    const handleSaveNote = async (id?: string) => {
        if (!isEditing) return;
        setSaving(true);
        const { error } = id
            ? await supabase.from('notes').update({ title: isEditing.title, content: isEditing.content }).eq('id', id)
            : await supabase.from('notes').insert({ title: isEditing.title, content: isEditing.content });

        if (!error) {
            setIsEditing(null);
            fetchNotes();
        }
        setSaving(false);
    };

    const togglePin = async (id: string, currentStatus: boolean) => {
        await supabase.from('notes').update({ is_pinned: !currentStatus }).eq('id', id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa ghi chú này?')) return;
        await supabase.from('notes').delete().eq('id', id);
        setIsEditing(null);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
    const recentNotes = filteredNotes.filter(n => !n.is_pinned);

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
            <header className="px-6 py-4 space-y-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-40 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight">Ghi chú gia đình</h1>
                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5">
                        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <FaSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
                        <input
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            placeholder="Tìm kiếm ghi chú..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-600">
                        <FaFilter size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 space-y-8">
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FaThumbtack size={16} className="text-primary fill-primary" />
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đã ghim</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pinnedNotes.map((note) => (
                                <NoteCard key={note.id} note={note} onTogglePin={togglePin} onClick={() => setIsEditing(note)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* All Notes Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ghi chú gần đây</h2>
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
                            <button className="p-1.5 text-primary bg-primary/10 rounded-lg"><FaThLarge size={14} /></button>
                            <button className="p-1.5 text-slate-400"><FaList size={14} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {recentNotes.map((note) => (
                            <NoteCard key={note.id} note={note} onTogglePin={togglePin} onClick={() => setIsEditing(note)} />
                        ))}
                    </div>
                </section>
            </main>

            {/* Note Editor Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><FaTimesCircle size={24} /></button>
                            <div className="flex gap-2">
                                {isEditing.id && (
                                    <button onClick={() => handleDelete(isEditing.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><FaTrash size={20} /></button>
                                )}
                                <button onClick={() => handleSaveNote(isEditing.id)} disabled={saving} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all">
                                    {saving ? <FaSpinner size={18} className="animate-spin" /> : <FaSave size={18} />}
                                    Lưu
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <input
                                className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300"
                                placeholder="Tiêu đề ghi chú"
                                value={isEditing.title}
                                onChange={(e) => setIsEditing({ ...isEditing, title: e.target.value })}
                            />
                            <textarea
                                className="w-full h-[300px] bg-transparent border-none outline-none resize-none font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-300"
                                placeholder="Viết ghi chú gia đình tại đây..."
                                value={isEditing.content}
                                onChange={(e) => setIsEditing({ ...isEditing, content: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <div className="fixed bottom-28 right-6 z-30 lg:right-12">
                <button
                    onClick={() => setIsEditing({ id: '', title: '', content: '', is_pinned: false, created_at: '', updated_at: '' })}
                    className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center transition-transform active:scale-90 lg:size-20"
                >
                    <FaPlus size={32} />
                </button>
            </div>
        </div>
    );
};

const NoteCard: React.FC<{ note: Note, onTogglePin: (id: string, s: boolean) => void, onClick: () => void }> = ({ note, onTogglePin, onClick }) => (
    <div
        onClick={onClick}
        className="group relative bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-sm line-clamp-2 leading-tight pr-4">{note.title || 'Không tiêu đề'}</h3>
            <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(note.id, note.is_pinned); }}
                className={`p-1 rounded-md transition-colors ${note.is_pinned ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}
            >
                <FaThumbtack size={14} className={note.is_pinned ? 'fill-primary' : ''} />
            </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed italic mb-4">
            {note.content || 'Nội dung trống...'}
        </p>
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-auto">
            <FaClock size={8} />
            {format(new Date(note.created_at), 'dd MMM', { locale: vi })}
        </div>

        {/* Decorator */}
        <div className="absolute -bottom-2 -right-2 size-12 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/20 transition-colors"></div>
    </div>
);

export default Notes;
