import React from 'react';
import { Bell, Search, ScanLine, Note, MessageSquare, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
    return (
        <div className="px-4 py-4 space-y-6">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="size-10 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-800 shadow-sm"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTORBZwfG6sfxSD54HNHvO-4DXvkgu4m0ocqZ__nBEH7mGlMeB43Assnp3PesQyMhOsOKFKDOk1xyRhYBN56QXcK6Fe3fJPYPF_4DLiW8M4SMTdzn97_HrKdVet-iJ1b6nPbVN8y2_Mmln8wOctZiOiBJczNBd5GXuglCiDd4pkrjM7nCvqkfaAe_cIYwpr6dY0Ag2gnSm882UuYyygi3eqkczey72kTPXjL1iSMoo9HqKrxLvBxYRu8Yodr62bZXlbaUwmPaoCWdb")' }}
                    />
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Good morning</p>
                        <h1 className="text-lg font-bold leading-tight">Miller Family</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm transition-transform active:scale-95">
                        <Search size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95">
                        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                            <ScanLine size={28} />
                        </div>
                        <span className="text-xs font-bold">Scan AI</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Note size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">New Note</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform active:scale-95">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold">Family Chat</span>
                    </button>
                </div>
            </section>

            {/* Spending Progress Card */}
            <section className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold">Monthly Spending</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">September 2023</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-primary">$1,625</p>
                        <p className="text-xs text-slate-400">of $2,500 limit</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                            <Clock size={14} /> 12 days left
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">$875 remaining</span>
                    </div>
                </div>
            </section>

            {/* Recent Notes Masonry */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Recent Notes</h2>
                    <button className="text-primary text-sm font-bold active:opacity-70">View All</button>
                </div>
                <div className="columns-2 gap-3 space-y-3">
                    {/* Note 1 */}
                    <div className="break-inside-avoid bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm mb-2">🛒 Grocery List</h4>
                        <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2"><div className="size-3 border rounded-sm border-slate-300 dark:border-slate-600" /> Almond milk</li>
                            <li className="flex items-center gap-2"><div className="size-3 border rounded-sm border-slate-300 dark:border-slate-600" /> Avocados (3)</li>
                            <li className="flex items-center gap-2"><div className="size-3 bg-primary rounded-sm flex items-center justify-center text-[8px] text-white">✓</div> Chicken breast</li>
                        </ul>
                    </div>
                    {/* Note 2 */}
                    <div className="break-inside-avoid bg-primary/10 dark:bg-primary/20 p-4 rounded-xl border border-primary/20">
                        <h4 className="font-bold text-sm mb-2">⚽ Soccer Practice</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            Tuesdays & Thursdays at 5:00 PM. Don't forget water bottles and cleats!
                        </p>
                    </div>
                    {/* Note 3 */}
                    <div className="break-inside-avoid bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div
                            className="w-full h-24 bg-cover bg-center rounded-lg mb-2"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDgTDvJIj8HV7LFMuoLlP99u8Iomghv-HaxOvDFDGrmxjqxtNa8l_ONJU_gYXjIaEmNN1gkc-O5bjv03wFu90cM2WvjOEQawpJAc4bHLx-zb9TmnQ4Sx02gRM71K-NeDbQhQ8IfId-CqsH8iDtL5nRq3IcFbH3BVbRN226qO2dmHd2i3hxF_fecEvtEPI8hQmbPLUidyqRy20uSOdCzzNQ0lwXuTzCWO8mZtzSUZ22TBHswyFMBkIIe2HlUAlssIKv1latIwbdn-Ibk")' }}
                        />
                        <h4 className="font-bold text-sm mb-1">🏔️ Weekend Trip</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Looking at cabins in Lake Tahoe for the break.</p>
                    </div>
                    {/* Note 4 */}
                    <div className="break-inside-avoid bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm mb-2">💡 Wi-Fi Password</h4>
                        <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded text-slate-600 dark:text-slate-300">family-cloud-2023</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
