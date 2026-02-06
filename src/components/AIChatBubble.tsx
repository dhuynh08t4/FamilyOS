import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaMagic, FaLaughSquint, FaStickyNote, FaChartPie, FaWallet, FaListUl, FaFire, FaHistory, FaExpandAlt } from 'react-icons/fa';
import { processAIRequest, executeAIAction } from '../lib/ai-agent';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/ToastProvider';

const AIChatBubble: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string, data?: any }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (customMsg?: string) => {
        const userMsg = (customMsg || input).trim();
        if (!userMsg || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Chưa đăng nhập");

            const response = await processAIRequest(userMsg, user.id);

            let queryData = null;
            if (response.action) {
                const actionResult = await executeAIAction(response.action, user.id);
                if (actionResult.error) {
                    showToast(actionResult.error.message, 'error');
                } else if (actionResult.data) {
                    queryData = actionResult;
                    showToast("Đã tìm thấy thông tin!", 'success');
                } else {
                    showToast("Đã thực hiện yêu cầu thành công!", 'success');
                    window.dispatchEvent(new CustomEvent('family-os-refresh'));
                    if (response.action.target === 'theme') {
                        window.location.reload();
                    }
                }
            }

            setMessages(prev => [...prev, { role: 'ai', content: response.message, data: queryData }]);

        } catch (error: any) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "Xin lỗi, tôi gặp lỗi khi xử lý: " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = (action: { label: string, type: 'direct' | 'input' }) => {
        if (action.type === 'direct') {
            handleSend(action.label);
        } else {
            setInput(action.label + ' ');
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const renderData = (res: any) => {
        if (!res || !res.data) return null;
        const { data, type } = res;

        return (
            <div className="mt-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-white/20 dark:border-slate-700/50 space-y-2 text-[11px]">
                {type === 'transactions' && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                        <p className="font-bold border-b border-primary/20 pb-1 mb-2">Giao dịch gần đây:</p>
                        {data.map((t: any) => (
                            <div key={t.id} className="flex justify-between gap-2">
                                <span className="truncate">{t.note || t.category}</span>
                                <span className={`font-bold ${t.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                                    {t.type === 'expense' ? '-' : '+'}{Number(t.amount).toLocaleString()}đ
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                {type === 'budget' && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                        <p className="font-bold border-b border-primary/20 pb-1 mb-2">Dự chi hiện tại:</p>
                        {data.map((b: any) => (
                            <div key={b.id} className="flex justify-between">
                                <span className="truncate">{b.name}</span>
                                <span className="font-bold">{Number(b.planned_amount).toLocaleString()}đ</span>
                            </div>
                        ))}
                    </div>
                )}
                {type === 'notes' && (
                    <div className="space-y-1 text-slate-700 dark:text-slate-200">
                        <p className="font-bold border-b border-primary/20 pb-1 mb-2">Ghi chú tìm thấy:</p>
                        {data.map((n: any) => (
                            <div key={n.id} className="p-1.5 bg-primary/5 rounded border border-primary/10">
                                <p className="font-bold">{n.title}</p>
                                <p className="opacity-70 line-clamp-1">{n.content}</p>
                            </div>
                        ))}
                    </div>
                )}
                {type === 'members' && (
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-200">
                        {data.map((p: any, idx: number) => (
                            <div key={idx} className="flex flex-col items-center p-2 bg-primary/5 rounded-xl border border-primary/10">
                                <span className="font-bold truncate w-full text-center">{p.nice_name || p.full_name}</span>
                                <span className="text-[9px] opacity-60 uppercase">{p.role}</span>
                            </div>
                        ))}
                    </div>
                )}
                {data.length === 0 && <p className="text-center opacity-50">Không có dữ liệu phù hợp.</p>}
            </div>
        );
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 max-w-[90vw] h-[450px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
                    <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary/5 rounded-t-3xl">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <FaMagic size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">Family Assistant</h3>
                                <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Trực tuyến
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/chat?mode=ai');
                                }}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-slate-400 hover:text-primary transition-all"
                                title="Mở trang chủ"
                            >
                                <FaExpandAlt size={14} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <FaTimes size={18} />
                            </button>
                        </div>
                    </header>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center py-8 space-y-4">
                                <FaRobot className="mx-auto text-primary/10" size={64} />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Chào bạn! Tôi có thể giúp gì?</p>
                                    <p className="text-[10px] text-slate-400 px-4">Thêm chi tiêu, ghi chú, đổi theme hoặc gửi tin nhắn... Chỉ cần hỏi tôi!</p>
                                </div>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100/50 dark:border-slate-700/50'
                                    }`}>
                                    {m.content}
                                    {renderData(m.data)}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none animate-pulse">
                                    <FaSpinner className="animate-spin text-primary" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl space-y-3">
                        {/* Quick Actions */}
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                            {[
                                { icon: FaLaughSquint, label: "Kể 1 câu chuyện cười", type: 'direct', title: "Kể chuyện cười" },
                                { icon: FaStickyNote, label: "Thêm ghi chú:", type: 'input', title: "Thêm ghi chú" },
                                { icon: FaChartPie, label: "Thêm khoản cần chi:", type: 'input', title: "Dự chi mới" },
                                { icon: FaWallet, label: "Thêm khoản đã chi:", type: 'input', title: "Chi tiêu mới" },
                                { icon: FaListUl, label: "Tóm tắt dự chi tháng này", type: 'direct', title: "Tóm tắt dự chi" },
                                { icon: FaHistory, label: "10 ghi chú gần nhất", type: 'direct', title: "10 ghi chú gần nhất" },
                                { icon: FaFire, label: "5 khoản chi nhiều nhất tháng này", type: 'direct', title: "5 khoản chi lớn nhất" },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action as any)}
                                    title={action.title}
                                    className="flex-shrink-0 size-11 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
                                >
                                    <action.icon size={24} className="text-primary" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                placeholder="Hãy nhập yêu cầu của bạn..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="size-11 flex-shrink-0 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 disabled:opacity-50 transition-all"
                            >
                                <FaPaperPlane size={18} />
                            </button>
                        </div>
                    </footer>
                </div>
            )}

            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto size-14 lg:size-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group ${isOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-600' : 'bg-primary text-white hover:scale-105'
                    }`}
            >
                {isOpen ? <FaTimes size={24} /> : (
                    <div className="relative">
                        <FaRobot size={28} className="animate-bounce-subtle" />
                        <span className="absolute -top-1 -right-1 size-3 bg-green-500 border-2 border-primary rounded-full"></span>
                    </div>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        AI Assistant
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIChatBubble;
