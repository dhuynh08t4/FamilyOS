import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaImage, FaPlus, FaSearch, FaSpinner, FaUser, FaVideo, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Message, Profile } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchInitialData();

        // Subscribe to NEW messages
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => [...prev, newMessage]);
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchInitialData = async () => {
        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user.id);

            // 2. Fetch profiles
            const { data: profData } = await supabase.from('profiles').select('*');
            if (profData) {
                const map = profData.reduce((acc, curr) => { acc[curr.id] = curr; return acc; }, {} as Record<string, Profile>);
                setProfiles(map);
            }

            // 3. Fetch recent messages
            const { data: msgData } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);

            if (msgData) setMessages(msgData);

        } catch (error) {
            console.error('Lỗi trò chuyện:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && !sending) || !currentUser) return;

        const textToSubmit = inputText.trim();
        setInputText('');

        try {
            const { error } = await supabase.from('messages').insert({
                user_id: currentUser,
                content: textToSubmit,
                type: 'text'
            });
            if (error) throw error;
        } catch (error) {
            console.error('Lỗi gửi tin:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setSending(true);
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1200 });
            const fileName = `chat/${currentUser}/${Date.now()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('family-os')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('family-os').getPublicUrl(fileName);

            const { error: dbError } = await supabase.from('messages').insert({
                user_id: currentUser,
                content: 'Đã chia sẻ một ảnh',
                type: 'image',
                image_url: publicUrl
            });

            if (dbError) throw dbError;
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-5rem)] bg-white dark:bg-background-dark">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <FaUser size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold">Gia đình</h1>
                        <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            {Object.keys(profiles).length} thành viên
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FaVideo size={20} className="text-slate-500" />
                    </button>
                    <button className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FaInfoCircle size={20} className="text-slate-500" />
                    </button>
                </div>
            </header>

            {/* Chat List & Main View (Tablet/Desktop Layout) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Side List (Optional hidden on mobile) */}
                <aside className="hidden lg:block w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-4">
                        <div className="relative">
                            <FaSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none" placeholder="Tìm kiếm thành viên..." />
                        </div>
                    </div>
                    <div className="space-y-1 px-2">
                        <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-xl flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">#</div>
                            <div>
                                <p className="text-sm font-bold">Nhóm chung</p>
                                <p className="text-[10px] text-slate-500 truncate">Kênh trò chuyện gia đình</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Messages Container */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-background-dark/50">
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                        {messages.map((msg, idx) => {
                            const isMe = msg.user_id === currentUser;
                            const profile = profiles[msg.user_id];
                            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                    {!isMe && showAvatar && (
                                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                            {profile?.full_name?.[0] || '?'}
                                        </div>
                                    )}
                                    {!isMe && !showAvatar && <div className="w-8 flex-shrink-0"></div>}

                                    <div className={`max-w-[75%] space-y-1`}>
                                        {!isMe && showAvatar && (
                                            <p className="text-[10px] font-bold text-slate-400 ml-1 mb-1">
                                                {profile?.nice_name || 'Thành viên'}
                                            </p>
                                        )}
                                        <div className={`
                                            px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all
                                            ${isMe
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'}
                                        `}>
                                            {msg.type === 'image' && msg.image_url ? (
                                                <div className="space-y-2">
                                                    <img src={msg.image_url} alt="Shared" className="rounded-lg max-w-full" />
                                                    {msg.content !== 'Đã chia sẻ một ảnh' && <p>{msg.content}</p>}
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                            <p className={`text-[8px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm', { locale: vi })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <footer className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                className="size-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                {sending ? <FaSpinner size={20} className="animate-spin" /> : <FaPlus size={22} />}
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FaImage size={18} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!inputText.trim() || sending}
                                className="size-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-90 disabled:opacity-50 disabled:scale-100"
                            >
                                <FaPaperPlane size={22} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </form>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Chat;
