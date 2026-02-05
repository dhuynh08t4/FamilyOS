import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Users, ChevronRight, LogOut, Save, Loader2, CheckCircle2, AtSign, UserCircle } from 'lucide-react';
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

    // Profile Edit State
    const [fullName, setFullName] = useState('');
    const [niceName, setNiceName] = useState('');
    const [username, setUsername] = useState('');

    const permissions = usePermission(myProfile);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (profilesData) {
                setProfiles(profilesData);
                const current = profilesData.find(p => p.id === user.id);
                if (current) {
                    setMyProfile(current);
                    setFullName(current.full_name || '');
                    setNiceName(current.nice_name || '');
                    setUsername(current.username || '');
                }
            }

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

    const handleUpdateMyProfile = async () => {
        if (!myProfile) return;
        setUpdating('profile');

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                nice_name: niceName,
                username: username,
                updated_at: new Date().toISOString()
            })
            .eq('id', myProfile.id);

        if (!error) {
            setMessage({ type: 'success', text: 'Profile updated!' });
            setMyProfile({ ...myProfile, full_name: fullName, nice_name: niceName, username });
            setProfiles(profiles.map(p => p.id === myProfile.id ? { ...p, full_name: fullName, nice_name: niceName, username } : p));
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: error.message });
        }
        setUpdating(null);
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
            if (permissions.isAdmin) {
                promises.push(supabase.from('app_settings').upsert({ key: 'GEMINI_API_KEY', value: globalApiKey }));
            }
            promises.push(supabase.from('user_settings').upsert({ user_id: user.id, key: 'GEMINI_API_KEY', value: personalApiKey }, { onConflict: 'user_id,key' }));

            await Promise.all(promises);
            setMessage({ type: 'success', text: 'API Keys saved!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save keys.' });
        } finally {
            setUpdating(null);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
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
            <header className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                    <User size={40} />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 size-5 border-4 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black truncate leading-tight">{myProfile?.full_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-black uppercase tracking-widest">{myProfile?.role}</span>
                        <span className="text-slate-400 text-xs font-medium">@{myProfile?.username || 'no-username'}</span>
                    </div>
                </div>
            </header>

            {/* Edit My Profile */}
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <UserCircle size={24} />
                        </div>
                        <h2 className="text-xl font-black">My Profile</h2>
                    </div>
                    <button
                        onClick={handleUpdateMyProfile}
                        disabled={updating === 'profile'}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {updating === 'profile' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary font-medium"
                            placeholder="Full Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nice Name (Short)</label>
                        <input
                            value={niceName}
                            onChange={(e) => setNiceName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary font-medium"
                            placeholder="Nickname"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <div className="relative">
                            <AtSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-12 py-4 outline-none focus:ring-2 focus:ring-primary font-medium"
                                placeholder="username"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Settings */}
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <Key size={24} />
                        </div>
                        <h2 className="text-xl font-black">AI Configuration</h2>
                    </div>
                    <button
                        onClick={saveApiKeys}
                        disabled={updating === 'keys'}
                        className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-90 disabled:opacity-50"
                    >
                        {updating === 'keys' ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    </button>
                </div>

                <div className="space-y-4">
                    {permissions.isAdmin && (
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Global Gemini Key (Default)</label>
                            <input
                                type="password"
                                value={globalApiKey}
                                onChange={(e) => setGlobalApiKey(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary outline-none font-medium"
                                placeholder="Enter global key..."
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Personal Gemini Key (Override)</label>
                        <input
                            type="password"
                            value={personalApiKey}
                            onChange={(e) => setPersonalApiKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary outline-none font-medium"
                            placeholder="Enter personal key..."
                        />
                    </div>
                </div>
            </section>

            {/* Alerts */}
            {message && (
                <div className={`p-5 rounded-3xl flex items-center justify-center gap-3 text-sm font-black border animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Family Members Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                    <h2 className="text-xl font-black">Family Members</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600">
                                    {profile.full_name[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-sm truncate">{profile.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">@{profile.username || 'n/a'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {permissions.isAdmin && profile.id !== myProfile?.id ? (
                                    <select
                                        value={profile.role}
                                        onChange={(e) => handleRoleUpdate(profile.id, e.target.value as UserRole)}
                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-2 py-1 text-[10px] font-black outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="admin">AD</option>
                                        <option value="member">MB</option>
                                        <option value="kid">KD</option>
                                    </select>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {profile.role.slice(0, 2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sign Out */}
            <div className="pt-8">
                <button
                    onClick={handleSignOut}
                    className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 py-6 rounded-[2.5rem] font-black text-lg shadow-sm border border-red-100 dark:border-red-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-red-100"
                >
                    <LogOut size={24} />
                    Sign Out From FamilyOS
                </button>
            </div>
        </div>
    );
};

export default Settings;
