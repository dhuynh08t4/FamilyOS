import React from 'react';
import { Users, Search, UserCircle, Pin, CheckSquare, Square, Sparkles, Plus } from 'lucide-react';

const Notes: React.FC = () => {
    const categories = ['All', 'Pinned', 'Groceries', 'Shared'];

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 pt-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users size={32} className="text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Family Notes</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <Search size={20} />
                        </button>
                        <button className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <UserCircle size={20} />
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full h-11 pl-10 pr-4 rounded-xl border-none bg-slate-200 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                            placeholder="Search family notes..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat, i) => (
                            <button
                                key={cat}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${i === 0 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-2 overflow-y-auto pb-24">
                {/* Pinned Section */}
                <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Pin size={14} className="text-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Pinned</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 leading-tight mb-2">WiFi Password</h3>
                            <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mb-3 line-clamp-3">Network: Home_Sweet_Home<br />Password: HappyFamily2024!</p>
                            <span className="text-[10px] font-medium text-blue-800/50 dark:text-blue-200/50">Updated Oct 12</span>
                        </div>
                        <div className="rounded-xl p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 leading-tight mb-2">Emergency Contacts</h3>
                            <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mb-3 line-clamp-3">Pediatrician: 555-0123<br />Poison Control: 1-800-222-1222</p>
                            <span className="text-[10px] font-medium text-amber-800/50 dark:text-amber-200/50">Updated Sep 20</span>
                        </div>
                    </div>
                </section>

                {/* All Notes */}
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Recent Notes</h2>
                    <div className="columns-2 gap-3 space-y-3">
                        <div className="break-inside-avoid rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold mb-2">Weekend Grocery List</h3>
                            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 mb-3">
                                <li className="flex items-center gap-1.5"><Square size={14} /> Almond Milk</li>
                                <li className="flex items-center gap-1.5"><Square size={14} /> Avocados (3)</li>
                                <li className="flex items-center gap-1.5"><CheckSquare size={14} className="text-primary" /> Chicken Breast</li>
                                <li className="flex items-center gap-1.5"><Square size={14} /> Greek Yogurt</li>
                            </ul>
                            <span className="text-[10px] font-medium text-slate-400">Today, 10:45 AM</span>
                        </div>

                        <div className="break-inside-avoid rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div
                                className="h-32 bg-cover bg-center"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2zHaqmCkFcA2SVqpERQLnKqsE2rnXmC6_FZIXaPrcatX_BPh6yR7gu_8e1a8Qzl84u50AlzEkrOz5NjVj_U47O5CIP4l8r4BaOq63zKMnoZUxLmrBrcyy2ZXpQZknS-P3VNY2T7HPE8dzymGJL_MsYbEbqXHPSTPmDh3DK1y9Wbdhke5SYPPYZTEU3JHT4W5uHJBqV5GlhIT0V3xLshb2B5X4VMUqfmABXnv9vTYJOA5SlVQSGreU5mCHdS6fXts7JMWlTZa3sVgH')" }}
                            />
                            <div className="p-4">
                                <div className="flex items-center gap-1 mb-1 text-primary">
                                    <Sparkles size={12} />
                                    <span className="text-[10px] font-bold uppercase">AI Scanned</span>
                                </div>
                                <h3 className="font-bold mb-1">Grandma's Pie Recipe</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">Preheat oven to 375. Mix cinnamon and apples...</p>
                                <span className="text-[10px] font-medium text-slate-400">Yesterday</span>
                            </div>
                        </div>

                        <div className="break-inside-avoid rounded-xl p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 shadow-sm">
                            <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">Soccer Practice</h3>
                            <p className="text-xs text-green-800 dark:text-green-200/80 mb-3">Don't forget the orange slices for the team this Saturday.</p>
                            <span className="text-[10px] font-medium text-green-800/40 dark:text-green-200/40">2 days ago</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Floating Action Button */}
            <button className="fixed bottom-24 right-6 flex items-center justify-center size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 active:scale-95 transition-transform z-50">
                <Plus size={32} />
            </button>
        </div>
    );
};

export default Notes;
