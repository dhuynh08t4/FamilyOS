import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaImage, FaPlus, FaSearch, FaSpinner, FaUser, FaVideo, FaInfoCircle, FaTrash, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Message, Profile } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';
import { useDialog } from '../components/ui/DialogProvider';
import { useToast } from '../components/ui/ToastProvider';

const Chat: React.FC = () => {
    const { confirm } = useDialog();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = currentUser && profiles[currentUser]?.role === 'admin';
    const imageMessages = messages.filter(m => m.type === 'image' && m.image_url);

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
            // Also listen for DELETEs to update UI in real-time if another admin deletes
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, imageMessages]);

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

    const handleDeleteMessage = async (msg: Message) => {
        const confirmed = await confirm({
            title: 'Xóa tin nhắn',
            message: 'Bạn có chắc chắn muốn xóa tin nhắn này không?',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            // Delete image if exists
            if (msg.type === 'image' && msg.image_url) {
                // Determine path from public URL
                // URL: .../family-os/chat/user/file
                const parts = msg.image_url.split('/family-os/');
                if (parts.length > 1) {
                    const path = parts[1];
                    await supabase.storage.from('family-os').remove([path]);
                }
            }

            const { error } = await supabase.from('messages').delete().eq('id', msg.id);
            if (error) throw error;

            // UI update handled by subscription
        } catch (error) {
            console.error('Lỗi xóa tin nhắn:', error);
        }
    };

    const handleClearChat = async () => {
        const confirmed = await confirm({
            title: 'Xóa toàn bộ đoạn chat',
            message: 'Hành động này sẽ xóa vĩnh viễn tất cả tin nhắn và hình ảnh. Bạn có chắc chắn không?',
            confirmText: 'Xóa tất cả',
            cancelText: 'Hủy',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            setLoading(true);

            // 1. Delete all images
            // Fetch all messages with images first to get paths
            const { data: imageMessages } = await supabase
                .from('messages')
                .select('image_url')
                .eq('type', 'image')
                .not('image_url', 'is', null);

            if (imageMessages && imageMessages.length > 0) {
                const paths = imageMessages
                    .map(m => {
                        const parts = m.image_url?.split('/family-os/');
                        return parts && parts.length > 1 ? parts[1] : null;
                    })
                    .filter(p => p) as string[];

                if (paths.length > 0) {
                    // Delete in batches if needed, but for now direct
                    await supabase.storage.from('family-os').remove(paths);
                }
            }

            // 2. Delete all messages
            // Using a condition that is always true to delete all rows
            const { error } = await supabase.from('messages').delete().gt('id', 0);
            if (error) throw error;

            setMessages([]);
        } catch (error) {
            console.error('Lỗi xóa đoạn chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLightbox = (msgId: string) => {
        const index = imageMessages.findIndex(m => m.id === msgId);
        if (index !== -1) setLightboxIndex(index);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null && lightboxIndex < imageMessages.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    };

    const handleVideoCall = () => {
        showToast('Tính năng gọi video đang được phát triển', 'info');
    };

    const handleInfo = () => {
        showToast(`Nhóm gia đình: ${Object.keys(profiles).length} thành viên`, 'info');
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
                    {isAdmin && (
                        <button
                            onClick={handleClearChat}
                            className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-500"
                            title="Xóa đoạn chat"
                        >
                            <FaTrash size={16} />
                        </button>
                    )}
                    <button onClick={handleVideoCall} className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FaVideo size={20} className="text-slate-500" />
                    </button>
                    <button onClick={handleInfo} className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <FaInfoCircle size={20} className="text-slate-500" />
                    </button>
                </div>
            </header>

            {/* Chat List & Main View (Tablet/Desktop Layout) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Side List (Optional hidden on mobile) */}
                <aside className="hidden lg:flex flex-col w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="p-4">
                        <div className="relative">
                            <FaSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none"
                                placeholder="Tìm kiếm thành viên..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-4">
                        <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-xl flex items-center gap-3 cursor-pointer">
                            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">#</div>
                            <div>
                                <p className="text-sm font-bold">Nhóm chung</p>
                                <p className="text-[10px] text-slate-500 truncate">Kênh trò chuyện gia đình</p>
                            </div>
                        </div>

                        {Object.values(profiles)
                            .filter(p => !memberSearch || (p.nice_name || p.full_name || '').toLowerCase().includes(memberSearch.toLowerCase()))
                            .map(profile => (
                                <div key={profile.id} className="p-3 rounded-xl flex items-center gap-3 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-70 hover:opacity-100">
                                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.nice_name || ''} className="size-full object-cover" />
                                        ) : (
                                            (profile.nice_name?.[0] || profile.full_name?.[0] || '?').toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{profile.nice_name || profile.full_name}</p>
                                        <p className="text-[10px] text-slate-400 capitalize">{profile.role === 'kid' ? 'Thành viên nhỏ' : (profile.role === 'admin' ? 'Quản trị viên' : 'Thành viên')}</p>
                                    </div>
                                    {profile.role === 'admin' && <div className="ml-auto text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded border border-yellow-200 dark:border-yellow-900/50">Admin</div>}
                                </div>
                            ))}
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
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                                    {!isMe && showAvatar && (
                                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.nice_name || ''} className="size-full object-cover" />
                                            ) : (
                                                (profile?.nice_name?.[0] || profile?.full_name?.[0] || '?').toUpperCase()
                                            )}
                                        </div>
                                    )}
                                    {!isMe && !showAvatar && <div className="w-8 flex-shrink-0"></div>}

                                    <div className={`max-w-[75%] space-y-1 relative`}>
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
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Shared"
                                                        className="rounded-lg max-w-[256px] max-h-[256px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => openLightbox(msg.id)}
                                                    />
                                                    {msg.content !== 'Đã chia sẻ một ảnh' && <p>{msg.content}</p>}
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                            <p className={`text-[8px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm', { locale: vi })}
                                            </p>
                                        </div>

                                        {/* Admin Delete Button */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg)}
                                                className={`absolute top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? '-left-8' : '-right-8'}`}
                                                title="Xóa tin nhắn"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        )}
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
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
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

            {/* Lightbox */}
            {lightboxIndex !== null && imageMessages[lightboxIndex] && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute right-4 top-4 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20"
                    >
                        <FaTimes size={24} />
                    </button>

                    <button
                        onClick={prevImage}
                        disabled={lightboxIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-20"
                    >
                        <FaChevronLeft size={32} />
                    </button>

                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        <img
                            src={imageMessages[lightboxIndex].image_url!}
                            alt="Full size"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm backdrop-blur-md">
                            {lightboxIndex + 1} / {imageMessages.length}
                        </div>
                    </div>

                    <button
                        onClick={nextImage}
                        disabled={lightboxIndex === imageMessages.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-20"
                    >
                        <FaChevronRight size={32} />
                    </button>

                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setLightboxIndex(null)}></div>
                </div>
            )}
        </div>
    );
};

export default Chat;
