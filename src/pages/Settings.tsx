import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Users, ChevronRight, LogOut, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { usePermission } from '../hooks/usePermission';

const Settings: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [myProfile, setMyProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [globalApiKey, setGlobalApiKey] = useState('');
    const [personalApiKey, setPersonalApiKey] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const permissions = usePermission(myProfile);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 2. Get all profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (profilesData) {
                setProfiles(profilesData);
                const current = profilesData.find(p => p.id === user.id);
                if (current) setMyProfile(current);
            }

            // 3. Get API Keys
            const [{ data: globalKey }, { data: personalKey }] = await Promise.all([
                supabase.from('app_settings').select('value').eq('key', 'GEMINI_API_KEY').single(),
                supabase.from('user_settings').select('value').eq('key', 'GEMINI_API_KEY').eq('user_id', user.id).single()
            ]);

            if (globalKey) setGlobalApiKey(globalKey.value || '');
            if (personalKey) setPersonalApiKey(personalKey.value || '');

        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (profileId: string, newRole: UserRole) => {
        setUpdating(profileId);
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', profileId);

        if (!error) {
            setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p));
        }
        setUpdating(null);
    };

    const saveApiKeys = async () => {
        setUpdating('keys');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const promises = [];

            // Save Global Key if Admin
            if (permissions.isAdmin) {
                promises.push(
                    supabase.from('app_settings').upsert({ key: 'GEMINI_API_KEY', value: globalApiKey })
                );
            }

            // Save Personal Key
            promises.push(
                supabase.from('user_settings').upsert({
                    user_id: user.id,
                    key: 'GEMINI_API_KEY',
                    value: personalApiKey
                }, { onConflict: 'user_id,key' })
            );

            await Promise.all(promises);
            setMessage({ type: 'success', text: 'API Keys saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save API keys.' });
        } finally {
            setUpdating(null);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="px-4 py-6 max-w-4xl mx-auto space-y-8 pb-32">
            <header className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{myProfile?.full_name || 'My Account'}</h1>
                    <p className="text-slate-500 text-sm uppercase font-bold tracking-wider">{myProfile?.role}</p>
                </div>
            </header>

            {/* API Settings */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <Key size={24} />
                        </div>
                        <h2 className="text-lg font-bold">AI Configuration</h2>
                    </div>
                    <button
                        onClick={saveApiKeys}
                        disabled={updating === 'keys'}
                        className="size-10 bg-primary text-white rounded-xl flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
                    >
                        {updating === 'keys' ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    </button>
                </div>

                <div className="space-y-4">
                    {permissions.isAdmin && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Global Gemini API Key (Family Default)</label>
                            <input
                                type="password"
                                value={globalApiKey}
                                onChange={(e) => setGlobalApiKey(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Enter global key..."
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Personal Gemini API Key (Override)</label>
                        <input
                            type="password"
                            value={personalApiKey}
                            onChange={(e) => setPersonalApiKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Enter personal key..."
                        />
                    </div>
                    {message && (
                        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.type === 'success' && <CheckCircle2 size={16} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </section>

            {/* Family Members Section */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                    <h2 className="text-lg font-bold">Family Members</h2>
                </div>

                {/* Desktop/Tablet View */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {profiles.map((profile) => (
                                <tr key={profile.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                                                {profile.full_name[0]}
                                            </div>
                                            <span className="font-bold">{profile.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">@{profile.username || 'n/a'}</td>
                                    <td className="px-6 py-4 flex justify-center">
                                        {permissions.isAdmin && profile.id !== myProfile?.id ? (
                                            <select
                                                value={profile.role}
                                                onChange={(e) => handleRoleUpdate(profile.id, e.target.value as UserRole)}
                                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                                <option value="kid">Kid</option>
                                            </select>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 uppercase">
                                                {profile.role}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 text-xs">
                                    {profile.full_name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{profile.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {permissions.isAdmin && profile.id !== myProfile?.id && (
                                    <select
                                        value={profile.role}
                                        onChange={(e) => handleRoleUpdate(profile.id, e.target.value as UserRole)}
                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                                    >
                                        <option value="admin">A</option>
                                        <option value="member">M</option>
                                        <option value="kid">K</option>
                                    </select>
                                )}
                                <ChevronRight size={16} className="text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Other Settings */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                            <Shield size={22} />
                        </div>
                        <span className="font-bold">Privacy & Security</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6"></div>
                <button
                    onClick={handleSignOut}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <LogOut size={22} />
                        </div>
                        <span className="font-bold">Sign Out</span>
                    </div>
                    <ChevronRight size={20} />
                </button>
            </section>
        </div>
    );
};

export default Settings;
