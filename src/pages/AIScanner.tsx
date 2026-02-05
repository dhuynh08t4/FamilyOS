import React, { useState } from 'react';
import { ChevronLeft, ZoomIn, RefreshCw, Check, Calendar, ChevronDown, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIScanner: React.FC = () => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(true);
    const progress = 65;

    // Mock data state
    const [amount, setAmount] = useState('142.50');
    const [date, setDate] = useState('Oct 24, 2023');
    const [category, setCategory] = useState('Groceries');
    const [notes, setNotes] = useState("Weekly family shop at Trader Joe's. Includes school lunch supplies.");

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold tracking-tight">AI Smart Scanner</h1>
                <button className="text-primary font-semibold text-sm">Help</button>
            </header>

            <main className="max-w-md mx-auto pb-32 w-full">
                {/* Image Preview Container */}
                <div className="px-4 py-6">
                    <div className="relative group">
                        <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                            <img
                                alt="Captured document preview"
                                className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYSq_hHkF7w4ocN2tj5_5T_mO52BpoHBW4cBRAluvtXgqYlxGzto4QJBcumybwR1cfFfogH7uaqFCXPiaOhztKmEKpVj7IdZrhs9kGhL4PrJQKUid9natPvdY8gBe-KlwvGa9Ic1FH1B7_H2nEmXAk-gbRldelCS0rRizCOEb3ZTpf-ZawDxPBhzREcFT3iib88DUfTflxUUisSvGYZYw_mEua7eRo_Q9dUnVPZUnTHY4ENNIm0XQRw_V7tgsDoCY4CTKS6Epz8Kwc"
                            />

                            {/* Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                                    <Loader2 size={64} className="text-primary animate-spin mb-4" />
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-sm font-medium">Processing with Gemini AI</span>
                                            <span className="text-white text-xs font-bold bg-primary px-2 py-0.5 rounded-full">{progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <p className="text-white/80 text-[10px] mt-2 uppercase tracking-widest text-center">Identifying line items...</p>
                                    </div>
                                    <button
                                        onClick={() => setIsProcessing(false)}
                                        className="mt-4 text-white/60 text-xs underline"
                                    >
                                        Skip to manual
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-primary">
                            <ZoomIn size={20} />
                        </button>
                    </div>
                </div>

                {/* Extracted Details Form */}
                <section className="px-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Review Details</h2>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <Sparkles size={10} className="text-primary" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Verified</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Amount Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Total Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary">$</span>
                                <input
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-4 pl-10 pr-12 text-2xl font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={24} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Date</label>
                                <div className="relative">
                                    <input
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                    <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Category</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option>Groceries</option>
                                        <option>Dining Out</option>
                                        <option>Kids</option>
                                        <option>Household</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Notes / Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Notes</label>
                            <textarea
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[80px] resize-none"
                                placeholder="Add a description..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Quick Category Pills */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <button className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">Essential</button>
                            <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold border border-transparent">Split with Sarah</button>
                            <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold border border-transparent">Tax Deductible</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Actions Container */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-50">
                <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsProcessing(true)}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <RefreshCw size={18} />
                        Rescan
                    </button>
                    <button
                        onClick={() => navigate('/wallet')}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all active:scale-95"
                    >
                        <Check size={18} />
                        Save to Family
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AIScanner;
