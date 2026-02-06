import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaPaperPlane, FaImage, FaPlus, FaSearch, FaSpinner, FaUser, FaVideo, FaInfoCircle, FaTrash, FaTimes, FaChevronLeft, FaChevronRight, FaRobot, FaMagic, FaLaughSquint, FaStickyNote, FaChartPie, FaWallet, FaListUl, FaFire, FaHistory, FaVolumeUp } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import type { Message, Profile } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';
import { useDialog } from '../components/ui/DialogProvider';
import { useToast } from '../components/ui/ToastProvider';
import { processAIRequest, executeAIAction } from '../lib/ai-agent';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentRoom, setCurrentRoom] = useState<'group' | 'ai'>(searchParams.get('mode') === 'ai' ? 'ai' : 'group');
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; content: string; created_at: string }[]>([]);

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

        if (currentRoom === 'ai') {
            const now = new Date().toISOString();
            setAiMessages(prev => [...prev, { role: 'user', content: textToSubmit, created_at: now }]);
            setSending(true);
            try {
                const response = await processAIRequest(textToSubmit, currentUser!);
                const aiNow = new Date().toISOString();
                setAiMessages(prev => [...prev, { role: 'ai', content: response.message, created_at: aiNow }]);

                if (response.action) {
                    const actionResult = await executeAIAction(response.action, currentUser);
                    if (actionResult.error) {
                        showToast(actionResult.error.message, 'error');
                    } else {
                        showToast("Trợ lý đã thực hiện yêu cầu!", 'success');
                        window.dispatchEvent(new CustomEvent('family-os-refresh'));
                    }
                }
            } catch (error) {
                console.error('AI Chat Error:', error);
            } finally {
                setSending(false);
            }
            return;
        }

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

    const handleQuickAction = (action: { label: string, type: 'direct' | 'input' }) => {
        if (action.type === 'direct') {
            const now = new Date().toISOString();
            setAiMessages(prev => [...prev, { role: 'user', content: action.label, created_at: now }]);
            setSending(true);
            processAIRequest(action.label, currentUser!).then(async response => {
                const aiNow = new Date().toISOString();
                setAiMessages(prev => [...prev, { role: 'ai', content: response.message, created_at: aiNow }]);
                if (response.action) {
                    const actionResult = await executeAIAction(response.action, currentUser!);
                    if (actionResult.error) {
                        showToast(actionResult.error.message, 'error');
                    } else {
                        showToast("Trợ lý đã thực hiện yêu cầu!", 'success');
                        window.dispatchEvent(new CustomEvent('family-os-refresh'));
                    }
                }
            }).catch(error => {
                console.error('AI Quick Action Error:', error);
            }).finally(() => {
                setSending(false);
            });
        } else {
            setInputText(action.label + ' ');
        }
    };

    const speakText = (text: string) => {
        if (!window.speechSynthesis) {
            showToast("Trình duyệt không hỗ trợ đọc văn bản", "error");
            return;
        }

        window.speechSynthesis.cancel();

        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();

            // Ưu tiên giọng Google Tiếng Việt hoặc giọng Natural của hệ thống
            const viVoice = voices.find(v => v.lang.includes('vi') && (v.name.includes('Google') || v.name.includes('Natural')))
                || voices.find(v => v.lang.includes('vi'));

            if (viVoice) utterance.voice = viVoice;

            utterance.lang = 'vi-VN';
            utterance.rate = 1.05;
            utterance.pitch = 1.0;

            window.speechSynthesis.speak(utterance);
        }, 50);
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
                    <div className={`size-10 rounded-full flex items-center justify-center font-bold ${currentRoom === 'ai' ? 'bg-slate-900 text-primary shadow-lg' : 'bg-primary/10 text-primary'}`}>
                        {currentRoom === 'ai' ? <FaRobot size={20} /> : <FaUser size={20} />}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold">{currentRoom === 'ai' ? 'Family Assistant' : 'Gia đình'}</h1>
                        <p className={`text-[10px] font-bold flex items-center gap-1 ${currentRoom === 'ai' ? 'text-primary animate-pulse' : 'text-green-500'}`}>
                            <span className={`size-1.5 rounded-full ${currentRoom === 'ai' ? 'bg-primary' : 'bg-green-500'} animate-pulse`}></span>
                            {currentRoom === 'ai' ? 'Trực tuyến' : `${Object.keys(profiles).length} thành viên`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {currentRoom === 'group' && isAdmin && (
                        <button
                            onClick={handleClearChat}
                            className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-500"
                            title="Xóa đoạn chat"
                        >
                            <FaTrash size={16} />
                        </button>
                    )}
                    {currentRoom === 'group' && (
                        <>
                            <button onClick={handleVideoCall} className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <FaVideo size={20} className="text-slate-500" />
                            </button>
                            <button onClick={handleInfo} className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <FaInfoCircle size={20} className="text-slate-500" />
                            </button>
                        </>
                    )}
                    {currentRoom === 'ai' && (
                        <div className="flex gap-1">
                            <button className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary" title="AI Analyst">
                                <FaChartPie size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    setAiMessages([{ role: 'ai', content: 'Chào bạn! Tôi có thể giúp gì cho gia đình mình hôm nay?', created_at: new Date().toISOString() }]);
                                }}
                                className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                                title="Làm mới hội thoại"
                            >
                                <FaSpinner size={16} className={sending ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    )}
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
                        <div
                            onClick={() => {
                                setCurrentRoom('group');
                                setSearchParams({});
                            }}
                            className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${currentRoom === 'group' ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white dark:hover:bg-slate-800 opacity-70'}`}
                        >
                            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">#</div>
                            <div>
                                <p className="text-sm font-bold">Nhóm chung</p>
                                <p className="text-[10px] text-slate-500 truncate">Kênh trò chuyện gia đình</p>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setCurrentRoom('ai');
                                setSearchParams({ mode: 'ai' });
                            }}
                            className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${currentRoom === 'ai' ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white dark:hover:bg-slate-800 opacity-70'}`}
                        >
                            <div className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">
                                <FaRobot size={20} className="text-primary animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">FamilyOS Assistant</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">Trực tuyến</p>
                            </div>
                        </div>

                        {/* AI Quick Tools Section */}
                        <div className="mt-8 px-4 mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <FaMagic className="text-primary" />
                                <span>AI Shortcuts</span>
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { icon: FaWallet, label: "Chi tiêu", color: "text-rose-500", prompt: "Tôi muốn thêm một khoản chi tiêu" },
                                    { icon: FaChartPie, label: "Dự chi", color: "text-emerald-500", prompt: "Tôi muốn thêm một khoản dự chi" },
                                    { icon: FaStickyNote, label: "Ghi chú", color: "text-blue-500", prompt: "Tôi muốn thêm một ghi chú" },
                                    { icon: FaLaughSquint, label: "Hài hước", color: "text-amber-500", prompt: "Kể một câu chuyện cười" },
                                ].map((tool, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (currentRoom !== 'ai') {
                                                setCurrentRoom('ai');
                                                setSearchParams({ mode: 'ai' });
                                            }
                                            handleSendMessage({ preventDefault: () => { }, target: { value: tool.prompt } } as any);
                                            // Wait, handleSendMessage uses inputText state.
                                            // I should setInputText then call handleSendMessage or just use the prompt.
                                            setInputText(tool.prompt);
                                            setTimeout(() => handleSendMessage(), 0);
                                        }}
                                        className="flex flex-col items-center gap-1 group"
                                    >
                                        <div className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <tool.icon size={18} className={tool.color} />
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-primary transition-colors">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 mt-6 mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Thành viên</h3>
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
                        {currentRoom === 'group' ? (
                            messages.map((msg, idx) => {
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
                            })
                        ) : (
                            aiMessages.map((msg, idx) => {
                                const isMe = msg.role === 'user';
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                                        {!isMe && (
                                            <div className="size-8 rounded-full bg-slate-900 text-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-lg border border-primary/20">
                                                <FaRobot size={18} />
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] space-y-1 relative`}>
                                            <div className={`
                                                px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all
                                                ${isMe
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'}
                                            `}>
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 whitespace-pre-wrap">{msg.content}</div>
                                                    {!isMe && (
                                                        <button
                                                            onClick={() => speakText(msg.content)}
                                                            className="mt-1 text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                                                            title="Đọc câu trả lời"
                                                        >
                                                            <FaVolumeUp size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className={`text-[8px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {format(new Date(msg.created_at), 'HH:mm', { locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <footer className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {[
                                { icon: FaLaughSquint, label: "Kể một câu chuyện cười", type: 'direct', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                                { icon: FaStickyNote, label: "Thêm ghi chú:", type: 'input', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                                { icon: FaChartPie, label: "Thêm dự chi:", type: 'input', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                { icon: FaWallet, label: "Thêm khoản chi:", type: 'input', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
                                { icon: FaListUl, label: "Tóm tắt dự chi", type: 'direct', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
                                { icon: FaHistory, label: "Xem ghi chú", type: 'direct', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
                                { icon: FaFire, label: "Chi tiêu lớn nhất", type: 'direct', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (currentRoom !== 'ai') {
                                            setCurrentRoom('ai');
                                            setSearchParams({ mode: 'ai' });
                                        }
                                        handleQuickAction(action as any);
                                    }}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95 border border-transparent hover:border-current ${action.color}`}
                                >
                                    <action.icon size={12} />
                                    <span>{action.label.replace(':', '')}</span>
                                </button>
                            ))}
                        </div>
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
