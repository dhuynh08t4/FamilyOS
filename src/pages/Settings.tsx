import React, { useState } from 'react';
import { User, Shield, Key, Users, ChevronRight, LogOut, Save } from 'lucide-react';
import type { UserRole } from '../types';

const Settings: React.FC = () => {
    // Mock data for profiles and current user role
    const [profiles] = useState([
        { id: '1', full_name: 'Damon Miller (Admin)', role: 'admin' as UserRole, avatar: 'https://i.pravatar.cc/150?u=damon' },
        { id: '2', full_name: 'Sarah Miller', role: 'member' as UserRole, avatar: 'https://i.pravatar.cc/150?u=sarah' },
        { id: '3', full_name: 'Leo Miller', role: 'kid' as UserRole, avatar: 'https://i.pravatar.cc/150?u=leo' },
    ]);

    const [currentUserRole] = useState<UserRole>('admin');
    const [globalKey, setGlobalKey] = useState('••••••••••••••••');
    const [personalKey, setPersonalKey] = useState('');

    return (
        <div className="px-4 py-6 space-y-8">
            <header>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-slate-500">Manage your family account and preferences</p>
            </header>

            {/* Profile Section */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold">My Profile</h2>
                            <p className="text-xs text-slate-500 text-capitalize">{currentUserRole}</p>
                        </div>
                    </div>
                    <button className="text-primary text-sm font-bold">Edit</button>
                </div>
            </section>

            {/* User Management (Admin Only) */}
            {currentUserRole === 'admin' && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Users size={18} className="text-slate-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Family Members</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                        {profiles.map((profile, idx) => (
                            <div
                                key={profile.id}
                                className={`flex items-center justify-between p-4 ${idx !== profiles.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={profile.avatar} alt={profile.full_name} className="size-10 rounded-full border border-slate-100 dark:border-slate-700" />
                                    <div>
                                        <p className="text-sm font-bold">{profile.full_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{profile.role}</p>
                                    </div>
                                </div>
                                <select
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-bold px-2 py-1 focus:ring-1 focus:ring-primary"
                                    defaultValue={profile.role}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="kid">Kid</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* API Keys Section */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Key size={18} className="text-slate-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">AI Configurations</h2>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Global Gemini API Key (Admin Only)</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={globalKey}
                                onChange={(e) => setGlobalKey(e.target.value)}
                                disabled={currentUserRole !== 'admin'}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary disabled:opacity-50"
                                placeholder="Enter global key"
                            />
                            {currentUserRole === 'admin' && (
                                <button className="bg-primary text-white p-2 rounded-xl">
                                    <Save size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Personal Gemini API Key (Optional)</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={personalKey}
                                onChange={(e) => setPersonalKey(e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary"
                                placeholder="Override with your key"
                            />
                            <button className="bg-primary text-white p-2 rounded-xl">
                                <Save size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support & Logout */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <Shield size={20} className="text-slate-400" />
                        <span className="text-sm font-medium">Privacy & Security</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <LogOut size={20} />
                        <span className="text-sm font-bold">Sign Out</span>
                    </div>
                </button>
            </section>

            <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">FamilyOS v1.0.0</p>
            </div>
        </div>
    );
};

export default Settings;
