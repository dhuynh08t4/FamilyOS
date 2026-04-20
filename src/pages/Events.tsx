import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    FaCalendarAlt,
    FaList,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaMoon,
    FaSun,
    FaBell,
    FaTrash,
    FaEdit,
    FaTimes,
    FaCheck
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { getLunarDate, getSolarDate, getDaysInLunarMonth } from '../utils/lunar';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
    id: string;
    title: string;
    description: string;
    is_lunar: boolean;
    start_date: string;
    repeat_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeat_config: any;
    reminders: number[];
    user_id: string;
}

const Events: React.FC = () => {
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredEvent, setHoveredEvent] = useState<{ event: Event, rect: DOMRect } | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_date', { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent?.title || !editingEvent?.start_date) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const finalDate = editingEvent.start_date;

        const eventData = {
            ...editingEvent,
            start_date: finalDate,
            user_id: user.id,
            updated_at: new Date().toISOString()
        };

        let error;
        if (editingEvent.id) {
            const { error: err } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', editingEvent.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('events')
                .insert([eventData]);
            error = err;
        }

        if (!error) {
            setIsModalOpen(false);
            setEditingEvent(null);
            fetchEvents();
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);
            if (!error) fetchEvents();
        }
    };

    const renderHeader = () => (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black dark:text-white mb-1">Sự kiện</h1>
                <p className="text-slate-500 font-medium">Quản lý lịch nhắc và các ngày kỷ niệm</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
                    <button
                        onClick={() => setView('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500'}`}
                    >
                        <FaCalendarAlt />
                        <span>Lịch</span>
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500'}`}
                    >
                        <FaList />
                        <span>Danh sách</span>
                    </button>
                </div>

                <button
                    onClick={() => { setEditingEvent({ repeat_type: 'none', reminders: [0], is_lunar: false, start_date: format(new Date(), 'yyyy-MM-dd') }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                >
                    <FaPlus />
                    <span>Thêm mới</span>
                </button>
            </div>
        </div>
    );

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
        const dayLabels = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

        // Pre-process events once per calendar render
        const eventsWithInfo = events.map(e => {
            const sd = parseISO(e.start_date);
            return {
                ...e,
                startDate: sd,
                startLunar: getLunarDate(sd.getDate(), sd.getMonth() + 1, sd.getFullYear())
            };
        });

        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center justify-between p-6 border-b border-slate-300/40 dark:border-slate-800">
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">
                        Tháng {format(currentMonth, 'MM, yyyy', { locale: vi })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors">
                            <FaChevronLeft />
                        </button>
                        <button onClick={() => setCurrentMonth(new Date())} className="px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors h-10">
                            Hôm nay
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setPickerYear(currentMonth.getFullYear());
                                    setIsDatePickerOpen(true);
                                }}
                                className="px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 hover:bg-primary/10 hover:text-primary active:scale-95 transition-all flex items-center gap-2 h-10"
                            >
                                <FaCalendarAlt size={12} className="text-primary" />
                                <span className="hidden sm:inline">Chọn nhanh</span>
                            </button>

                            <AnimatePresence>
                                {isDatePickerOpen && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setIsDatePickerOpen(false)}
                                            className="fixed inset-0 z-[120]"
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute top-full right-0 mt-4 w-72 bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 z-[121] overflow-hidden p-2"
                                        >
                                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                                <button onClick={() => setPickerYear(v => v - 1)} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                                                    <FaChevronLeft size={12} />
                                                </button>
                                                <span className="text-lg font-black dark:text-white tracking-tight">{pickerYear}</span>
                                                <button onClick={() => setPickerYear(v => v + 1)} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                                                    <FaChevronRight size={12} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 p-2">
                                                {['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'].map((m, idx) => {
                                                    const isSelected = currentMonth.getMonth() === idx && currentMonth.getFullYear() === pickerYear;
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => {
                                                                setCurrentMonth(new Date(pickerYear, idx, 1, 12, 0, 0));
                                                                setIsDatePickerOpen(false);
                                                            }}
                                                            className={`py-3 rounded-2xl text-[12px] font-semibold transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 mt-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        const now = new Date();
                                                        setPickerYear(now.getFullYear());
                                                        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
                                                        setIsDatePickerOpen(false);
                                                    }}
                                                    className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline"
                                                >
                                                    Về hiện tại
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors">
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-300/40 dark:border-slate-800">
                    {dayLabels.map(label => (
                        <div key={label} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 h-fit flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50">
                    {calendarDays.map((day, i) => {
                        const lunar = getLunarDate(day.getDate(), day.getMonth() + 1, day.getFullYear());
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentMonth);

                        const dayEvents = eventsWithInfo.filter(e => {
                            const { startDate, startLunar } = e;

                            // 1. Initial check: Repeating events start from their startDate
                            if (day < startDate && !isSameDay(day, startDate)) return false;

                            // 2. Specific Repeat Logic
                            if (e.repeat_type === 'none') {
                                return isSameDay(day, startDate);
                            }

                            if (e.is_lunar) {
                                switch (e.repeat_type) {
                                    case 'daily': return true;
                                    case 'weekly': return day.getDay() === startDate.getDay();
                                    case 'monthly': {
                                        if (lunar.day === startLunar.day) return true;
                                        if (startLunar.day === 30) {
                                            const nextDay = new Date(day);
                                            nextDay.setDate(day.getDate() + 1);
                                            const nextLunar = getLunarDate(nextDay.getDate(), nextDay.getMonth() + 1, nextDay.getFullYear());
                                            return lunar.day === 29 && nextLunar.day === 1;
                                        }
                                        return false;
                                    }
                                    case 'yearly': {
                                        if (lunar.month !== startLunar.month) return false;
                                        if (lunar.day === startLunar.day) return true;
                                        if (startLunar.day === 30) {
                                            const nextDay = new Date(day);
                                            nextDay.setDate(day.getDate() + 1);
                                            const nextLunar = getLunarDate(nextDay.getDate(), nextDay.getMonth() + 1, nextDay.getFullYear());
                                            return lunar.day === 29 && nextLunar.day === 1;
                                        }
                                        return false;
                                    }
                                    default: return false;
                                }
                            } else {
                                switch (e.repeat_type) {
                                    case 'daily': return true;
                                    case 'weekly': return day.getDay() === startDate.getDay();
                                    case 'monthly': {
                                        if (day.getDate() === startDate.getDate()) return true;
                                        const sDay = startDate.getDate();
                                        if (sDay >= 29) {
                                            const nextDay = new Date(day);
                                            nextDay.setDate(day.getDate() + 1);
                                            return day.getDate() < sDay && nextDay.getDate() === 1;
                                        }
                                        return false;
                                    }
                                    case 'yearly':
                                        return (day.getDate() === startDate.getDate() && day.getMonth() === startDate.getMonth());
                                    default: return false;
                                }
                            }
                        });

                        return (
                            <div
                                key={i}
                                className={`min-h-[120px] p-2 border-r border-b border-slate-300/40 dark:border-slate-800 flex flex-col gap-2 transition-colors relative hover:z-[70] ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`size-8 rounded-xl flex items-center justify-center font-black text-sm ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/20' : isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700'}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className={`text-[10px] font-bold ${lunar.day == 1 ? 'text-red-600 dark:text-red-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {lunar.day}/{lunar.month}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 overflow-visible max-h-20 scrollbar-none">
                                    {dayEvents.map(e => (
                                        <div
                                            key={e.id}
                                            className="relative"
                                            onMouseEnter={(event) => {
                                                const rect = event.currentTarget.getBoundingClientRect();
                                                setHoveredEvent({ event: e, rect });
                                            }}
                                            onMouseLeave={() => setHoveredEvent(null)}
                                        >
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 cursor-pointer ${e.is_lunar ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'}`} onClick={() => { setEditingEvent(e); setIsModalOpen(true); }}>
                                                {e.is_lunar ? <FaMoon size={8} className="shrink-0" /> : <FaSun size={8} className="shrink-0" />}
                                                <span className="truncate">{e.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderList = () => (
        <div className="space-y-4">
            {events.length > 0 ? (
                events.map(event => (
                    <div key={event.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:shadow-xl transition-all shadow-sm">
                        <div className={`size-14 rounded-2xl flex items-center justify-center text-xl shrink-0 ${event.is_lunar ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'}`}>
                            {event.is_lunar ? <FaMoon /> : <FaSun />}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-black dark:text-white capitalize">{event.title}</h3>
                            <div className="flex items-center gap-4 text-sm font-medium mt-1">
                                {event.is_lunar ? (
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-lg font-bold">
                                            <FaMoon size={10} /> {(() => {
                                                const d = parseISO(event.start_date);
                                                const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
                                                return `${l.day}/${l.month} Âm lịch`;
                                            })()}
                                        </span>
                                        <span className="text-slate-400 text-xs">(Dương: {format(parseISO(event.start_date), 'dd/MM/yyyy')})</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-lg font-bold">
                                        <FaSun size={10} /> {format(parseISO(event.start_date), 'dd/MM/yyyy')}
                                    </span>
                                )}
                                {event.repeat_type !== 'none' && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">{event.repeat_type}</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"><FaEdit /></button>
                            <button onClick={() => handleDeleteEvent(event.id)} className="size-10 rounded-xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><FaTrash /></button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <FaCalendarAlt size={40} />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">Bạn chưa có sự kiện nào</p>
                    <button
                        onClick={() => { setEditingEvent({ repeat_type: 'none', reminders: [0], is_lunar: false, start_date: format(new Date(), 'yyyy-MM-dd') }); setIsModalOpen(true); }}
                        className="mt-4 text-primary font-black hover:underline"
                    >
                        Thêm sự kiện đầu tiên ngay
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32">
            {renderHeader()}

            {loading ? (
                <div className="flex justify-center py-20">
                    <FaPlus className="animate-spin text-primary" size={30} />
                </div>
            ) : (
                view === 'calendar' ? renderCalendar() : renderList()
            )}

            {/* Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-2xl font-black dark:text-white">{editingEvent?.id ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"><FaTimes /></button>
                            </div>

                            <form onSubmit={handleSaveEvent} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên sự kiện</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingEvent?.title || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                            placeholder="Nhập tên sự kiện..."
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 mt-2 font-bold focus:ring-2 focus:ring-primary h-14"
                                        />
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 space-y-6 border border-slate-100 dark:border-slate-800">
                                        {/* Header with Type Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-8 rounded-xl flex items-center justify-center ${editingEvent?.is_lunar ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                    {editingEvent?.is_lunar ? <FaMoon size={14} /> : <FaSun size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chế độ lặp</p>
                                                    <p className="text-xs font-bold dark:text-white">{editingEvent?.is_lunar ? 'Theo Âm lịch' : 'Theo Dương lịch'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingEvent({ ...editingEvent, is_lunar: !editingEvent?.is_lunar })}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingEvent?.is_lunar ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                            >
                                                Đổi sang {editingEvent?.is_lunar ? 'Dương' : 'Âm'}
                                            </button>
                                        </div>

                                        {/* Solar Input */}
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 ml-1">
                                                <FaSun size={10} /> Dương lịch
                                            </label>
                                            <input
                                                required
                                                type="date"
                                                value={editingEvent?.start_date || ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 font-bold transition-all shadow-sm h-14"
                                            />
                                        </div>

                                        {/* Lunar Input */}
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2 ml-1">
                                                <FaMoon size={10} /> Âm lịch
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <select
                                                        value={(() => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            return getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear()).day;
                                                        })()}
                                                        onChange={e => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
                                                            const s = getSolarDate(Number(e.target.value), l.month, l.year);
                                                            setEditingEvent({ ...editingEvent, start_date: `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}` });
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-500 rounded-2xl p-4 font-bold appearance-none transition-all shadow-sm h-14"
                                                    >
                                                        {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                    <div className="text-[8px] font-bold text-center text-slate-400 mt-1">Ngày</div>
                                                </div>
                                                <div>
                                                    <select
                                                        value={(() => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            return getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear()).month;
                                                        })()}
                                                        onChange={e => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
                                                            const s = getSolarDate(l.day, Number(e.target.value), l.year);
                                                            setEditingEvent({ ...editingEvent, start_date: `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}` });
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-500 rounded-2xl p-4 font-bold appearance-none transition-all shadow-sm h-14"
                                                    >
                                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                    <div className="text-[8px] font-bold text-center text-slate-400 mt-1">Tháng</div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={(() => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            return getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear()).year;
                                                        })()}
                                                        onChange={e => {
                                                            const d = parseISO(editingEvent?.start_date || format(new Date(), 'yyyy-MM-dd'));
                                                            const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
                                                            const s = getSolarDate(l.day, l.month, Number(e.target.value));
                                                            setEditingEvent({ ...editingEvent, start_date: `${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}` });
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-900 border-2 border-transparent focus:border-orange-500 rounded-2xl p-4 font-bold transition-all shadow-sm h-14"
                                                    />
                                                    <div className="text-[8px] font-bold text-center text-slate-400 mt-1">Năm</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lặp lại</label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            {['none', 'daily', 'weekly', 'monthly', 'yearly'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setEditingEvent({ ...editingEvent, repeat_type: t as any })}
                                                    className={`p-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${editingEvent?.repeat_type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}
                                                >
                                                    {t === 'none' ? 'Không' : t === 'daily' ? 'Ngày' : t === 'weekly' ? 'Tuần' : t === 'monthly' ? 'Tháng' : 'Năm'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                            <FaBell size={10} /> Nhắc nhở
                                        </label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {[0, 1, 7, 30].map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = editingEvent?.reminders || [];
                                                        const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
                                                        setEditingEvent({ ...editingEvent, reminders: next });
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 ${editingEvent?.reminders?.includes(d) ? 'bg-primary/5 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'}`}
                                                >
                                                    {d === 0 ? 'Đúng ngày' : d === 1 ? 'Trước 1 ngày' : d === 7 ? 'Trước 1 tuần' : 'Trước 1 tháng'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả</label>
                                        <textarea
                                            value={editingEvent?.description || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                                            placeholder="Nhập chi tiết..."
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 mt-2 font-bold focus:ring-2 focus:ring-primary min-h-[100px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black hover:bg-slate-200 transition-colors">Hủy</button>
                                    <button type="submit" className="flex-2 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all px-8">
                                        <FaCheck /> Lưu sự kiện
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {hoveredEvent && createPortal(
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-90%" }}
                    animate={{ opacity: 1, scale: 1, x: "-50%", y: "-100%" }}
                    style={{
                        position: 'fixed',
                        top: hoveredEvent.rect.top - 12,
                        left: hoveredEvent.rect.left + hoveredEvent.rect.width / 2,
                        zIndex: 9999,
                    }}
                    className="w-56 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 pointer-events-none"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`size-6 rounded-lg flex items-center justify-center text-[10px] ${hoveredEvent.event.is_lunar ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {hoveredEvent.event.is_lunar ? <FaMoon /> : <FaSun />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {hoveredEvent.event.is_lunar ? 'Âm lịch' : 'Dương lịch'}
                        </span>
                    </div>
                    <p className="text-sm font-black dark:text-white mb-1">{hoveredEvent.event.title}</p>

                    <div className="mb-2">
                        {hoveredEvent.event.is_lunar ? (
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                    <FaMoon size={8} /> {(() => {
                                        const d = parseISO(hoveredEvent.event.start_date);
                                        const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
                                        return `${l.day}/${l.month} Âm lịch`;
                                    })()}
                                </p>
                                <p className="text-[10px] text-slate-400">Dương: {format(parseISO(hoveredEvent.event.start_date), 'dd/MM/yyyy')}</p>
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                <FaSun size={8} /> {format(parseISO(hoveredEvent.event.start_date), 'dd/MM/yyyy')}
                            </p>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[10px] font-black uppercase text-slate-500">
                            {hoveredEvent.event.repeat_type === 'none' ? 'Một lần' : `Lặp ${hoveredEvent.event.repeat_type}`}
                        </div>
                        {hoveredEvent.event.reminders.length > 0 && (
                            <div className="flex items-center gap-1 text-primary text-[10px] font-bold">
                                <FaBell size={10} /> {hoveredEvent.event.reminders.length} nhắc
                            </div>
                        )}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-slate-800" />
                </motion.div>,
                document.body
            )}
        </div>
    );
};

export default Events;
