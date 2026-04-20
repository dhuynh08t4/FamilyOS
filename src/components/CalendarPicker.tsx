import React, { useState, useEffect, useRef } from 'react';
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
    FaChevronLeft,
    FaChevronRight,
    FaMoon,
    FaSun
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getLunarDate, getSolarDate, getDaysInLunarMonth } from '../utils/lunar';

interface CalendarPickerProps {
    value: string;
    onChange: (val: string) => void;
    isLunar?: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ value, onChange, isLunar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const date = parseISO(value || format(new Date(), 'yyyy-MM-dd'));
    const lunarDate = getLunarDate(date.getDate(), date.getMonth() + 1, date.getFullYear());

    const [viewDate, setViewDate] = useState(date);
    const [viewLunarYear, setViewLunarYear] = useState(lunarDate.year);
    const [viewLunarMonth, setViewLunarMonth] = useState(lunarDate.month);

    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTriggerRect(triggerRef.current?.getBoundingClientRect() || null);
            
            // Sync view state when opening
            const d = parseISO(value || format(new Date(), 'yyyy-MM-dd'));
            const l = getLunarDate(d.getDate(), d.getMonth() + 1, d.getFullYear());
            setViewDate(d);
            setViewLunarYear(l.year);
            setViewLunarMonth(l.month);
        }
    }, [isOpen, value]);

    const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
    
    useEffect(() => {
        if (!isOpen) setViewMode('days');
    }, [isOpen]);

    const handleSelectSolar = (d: Date) => {
        onChange(format(d, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const handleSelectLunar = (lDay: number, lMonth: number, lYear: number) => {
        const s = getSolarDate(lDay, lMonth, lYear);
        onChange(`${s.year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`);
        setIsOpen(false);
    };

    const renderSolarHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><FaChevronLeft size={12} /></button>
            <button 
                type="button" 
                onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                className="text-sm font-black dark:text-white uppercase tracking-widest hover:text-primary transition-colors px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
                {format(viewDate, 'MMMM yyyy', { locale: vi })}
            </button>
            <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><FaChevronRight size={12} /></button>
        </div>
    );

    const renderLunarHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => {
                if (viewLunarMonth === 1) { setViewLunarMonth(12); setViewLunarYear(viewLunarYear - 1); }
                else setViewLunarMonth(viewLunarMonth - 1);
            }} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><FaChevronLeft size={12} /></button>
            <button 
                type="button" 
                onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                className="text-sm font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors px-4 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
                Tháng {viewLunarMonth} - {viewLunarYear}
            </button>
            <button type="button" onClick={() => {
                if (viewLunarMonth === 12) { setViewLunarMonth(1); setViewLunarYear(viewLunarYear + 1); }
                else setViewLunarMonth(viewLunarMonth + 1);
            }} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><FaChevronRight size={12} /></button>
        </div>
    );

    const calendarContent = (
        <AnimatePresence>
            {isOpen && triggerRect && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[10000] bg-slate-900/10 backdrop-blur-[4px]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            top: triggerRect.bottom + 8,
                            left: triggerRect.left + triggerRect.width / 2,
                            width: 'calc(100vw - 32px)',
                            maxWidth: '380px',
                        }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 z-[10001] overflow-hidden p-6"
                    >
                        {!isLunar ? (
                            <div className="space-y-4">
                                {renderSolarHeader()}
                                
                                <AnimatePresence mode="wait">
                                    {viewMode === 'days' && (
                                        <motion.div 
                                            key="days"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="grid grid-cols-7 mb-4">
                                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                                                    <div key={d} className="text-[10px] font-black text-slate-400 text-center uppercase">{d}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {(function () {
                                                    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
                                                    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
                                                    return eachDayOfInterval({ start, end }).map(d => {
                                                        const isSelected = isSameDay(d, date);
                                                        const isCurrMonth = isSameMonth(d, viewDate);
                                                        return (
                                                            <button
                                                                key={d.toISOString()}
                                                                type="button"
                                                                onClick={() => handleSelectSolar(d)}
                                                                className={`aspect-square rounded-2xl text-xs font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110 z-10' : isCurrMonth ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-800'}`}
                                                            >
                                                                {d.getDate()}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </motion.div>
                                    )}

                                    {viewMode === 'months' && (
                                        <motion.div 
                                            key="months"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="grid grid-cols-3 gap-3"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i).map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(viewDate);
                                                        newDate.setMonth(m);
                                                        setViewDate(newDate);
                                                        setViewMode('days');
                                                    }}
                                                    className={`py-4 rounded-2xl text-xs font-bold transition-all ${viewDate.getMonth() === m ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                                                >
                                                    Tháng {m + 1}
                                                </button>
                                            ))}
                                            <button 
                                                type="button" 
                                                onClick={() => setViewMode('years')}
                                                className="col-span-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-black uppercase tracking-widest dark:text-white mt-2"
                                            >
                                                Chọn Năm: {viewDate.getFullYear()}
                                            </button>
                                        </motion.div>
                                    )}

                                    {viewMode === 'years' && (
                                        <motion.div 
                                            key="years"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="h-[300px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-3 gap-2"
                                        >
                                            {Array.from({ length: 200 }, (_, i) => 1900 + i).map(y => {
                                                const isSelected = viewDate.getFullYear() === y;
                                                return (
                                                    <button
                                                        key={y}
                                                        ref={el => {
                                                            if (isSelected && el) {
                                                                setTimeout(() => el.scrollIntoView({ block: 'center' }), 100);
                                                            }
                                                        }}
                                                        type="button"
                                                        onClick={() => {
                                                            const newDate = new Date(viewDate);
                                                            newDate.setFullYear(y);
                                                            setViewDate(newDate);
                                                            setViewMode('months');
                                                        }}
                                                        className={`py-3 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300'}`}
                                                    >
                                                        {y}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {renderLunarHeader()}
                                
                                <AnimatePresence mode="wait">
                                    {viewMode === 'days' && (
                                        <motion.div 
                                            key="lunar-days"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <div className="grid grid-cols-6 gap-2">
                                                {Array.from({ length: getDaysInLunarMonth(viewLunarMonth, viewLunarYear) }, (_, i) => i + 1).map(d => {
                                                    const isSelected = lunarDate.day === d && lunarDate.month === viewLunarMonth && lunarDate.year === viewLunarYear;
                                                    return (
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            onClick={() => handleSelectLunar(d, viewLunarMonth, viewLunarYear)}
                                                            className={`aspect-square rounded-[1.25rem] text-xs font-bold transition-all flex flex-col items-center justify-center relative ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-110 z-10' : 'text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-orange-950/20'}`}
                                                        >
                                                            <span className="text-sm">{d}</span>
                                                            <span className="text-[8px] font-medium opacity-60">
                                                                {(() => {
                                                                    const s = getSolarDate(d, viewLunarMonth, viewLunarYear);
                                                                    return `${s.day}/${s.month}`;
                                                                })()}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {viewMode === 'months' && (
                                        <motion.div 
                                            key="lunar-months"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="grid grid-cols-3 gap-3"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => {
                                                        setViewLunarMonth(m);
                                                        setViewMode('days');
                                                    }}
                                                    className={`py-4 rounded-2xl text-xs font-bold transition-all ${viewLunarMonth === m ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:text-slate-300'}`}
                                                >
                                                    Tháng {m}
                                                </button>
                                            ))}
                                            <button 
                                                type="button" 
                                                onClick={() => setViewMode('years')}
                                                className="col-span-3 py-3 rounded-2xl bg-orange-50 dark:bg-orange-900/10 text-xs font-black uppercase tracking-widest text-orange-600 mt-2"
                                            >
                                                Chọn Năm: {viewLunarYear}
                                            </button>
                                        </motion.div>
                                    )}

                                    {viewMode === 'years' && (
                                        <motion.div 
                                            key="lunar-years"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="h-[300px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-3 gap-2"
                                        >
                                            {Array.from({ length: 200 }, (_, i) => 1900 + i).map(y => {
                                                const isSelected = viewLunarYear === y;
                                                return (
                                                    <button
                                                        key={y}
                                                        ref={el => {
                                                            if (isSelected && el) {
                                                                setTimeout(() => el.scrollIntoView({ block: 'center' }), 100);
                                                            }
                                                        }}
                                                        type="button"
                                                        onClick={() => {
                                                            setViewLunarYear(y);
                                                            setViewMode('months');
                                                        }}
                                                        className={`py-3 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:text-slate-300'}`}
                                                    >
                                                        {y}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white dark:bg-slate-900 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-2xl p-4 font-bold transition-all shadow-sm h-14 flex items-center justify-between group ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${isLunar ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isLunar ? <FaMoon size={14} /> : <FaSun size={14} />}
                    </div>
                    <span className="dark:text-white">
                        {isLunar ? `${String(lunarDate.day).padStart(2, '0')}/${String(lunarDate.month).padStart(2, '0')}/${lunarDate.year} Âm` : format(date, 'dd/MM/yyyy')}
                    </span>
                </div>
                <FaChevronRight size={10} className={`text-slate-400 group-hover:translate-x-0.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {typeof document !== 'undefined' && createPortal(calendarContent, document.body)}
        </>
    );
};
