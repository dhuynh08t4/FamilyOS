import React, { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

interface DialogContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolver.current) resolver.current(false);
    };

    return (
        <DialogContext.Provider value={{ confirm }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-black mb-2 dark:text-white">{options.title}</h3>
                            <p className="text-slate-500 font-medium">{options.message}</p>
                        </div>
                        <div className="flex border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                {options.cancelText || 'Hủy'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 py-4 font-bold transition-colors ${options.type === 'danger'
                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-primary hover:bg-primary/5'
                                    }`}
                            >
                                {options.confirmText || 'Đồng ý'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};
