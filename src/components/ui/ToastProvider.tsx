import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300 ${toast.type === 'success' ? 'bg-white/90 dark:bg-slate-900/90 border-green-200 dark:border-green-900' :
                            toast.type === 'error' ? 'bg-white/90 dark:bg-slate-900/90 border-red-200 dark:border-red-900' :
                                'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-500 dark:bg-green-900/30' :
                            toast.type === 'error' ? 'bg-red-100 text-red-500 dark:bg-red-900/30' :
                                'bg-blue-100 text-blue-500 dark:bg-blue-900/30'
                            }`}>
                            {toast.type === 'success' && <FaCheckCircle size={20} />}
                            {toast.type === 'error' && <FaExclamationCircle size={20} />}
                            {toast.type === 'info' && <FaInfoCircle size={20} />}
                        </div>
                        <p className={`text-sm font-bold flex-1 ${toast.type === 'success' ? 'text-green-700 dark:text-green-300' :
                            toast.type === 'error' ? 'text-red-700 dark:text-red-300' :
                                'text-slate-700 dark:text-slate-300'
                            }`}>
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
