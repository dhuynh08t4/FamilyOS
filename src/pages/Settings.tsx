import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Shield, Key, Users, LogOut, Save, Loader2, CheckCircle2, AtSign, UserCircle, XCircle, Camera, Upload, Edit3, X, Scissors, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { usePermission } from '../hooks/usePermission';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropUtils';

const Settings: React.FC = () => {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [myProfile, setMyProfile] = useState<Profile | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [globalApiKey, setGlobalApiKey] = useState('');
    const [personalApiKey, setPersonalApiKey] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Edit State
    const [fullName, setFullName] = useState('');
    const [niceName, setNiceName] = useState('');
    const [username, setUsername] = useState('');

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [quality, setQuality] = useState(0.8);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewSize, setPreviewSize] = useState(0);

    const permissions = usePermission(myProfile);

    useEffect(() => {
        fetchData();
    }, []);

    // Effect to update preview whenever crop or quality changes
    useEffect(() => {
        const updatePreview = async () => {
            if (cropImage && croppedAreaPixels) {
                const blob = await getCroppedImg(cropImage, croppedAreaPixels, 128, quality);
                if (blob) {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(URL.createObjectURL(blob));
                    setPreviewSize(blob.size);
                }
            }
        };

        const timeoutId = setTimeout(updatePreview, 100); // Debounce preview updates
        return () => {
            clearTimeout(timeoutId);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [croppedAreaPixels, quality, cropImage]);

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
                    handleSelectProfile(current);
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

    const handleSelectProfile = (profile: Profile) => {
        setSelectedProfile(profile);
        setFullName(profile.full_name || '');
        setNiceName(profile.nice_name || '');
        setUsername(profile.username || '');
        if (window.innerWidth < 768) {
            document.getElementById('profile-edit-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImage(reader.result as string);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        if (!cropImage || !croppedAreaPixels || !selectedProfile) return;

        setUpdating('avatar');
        try {
            // Get cropped blob (128px, using selected quality)
            const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, 128, quality);
            if (!croppedBlob) throw new Error('Failed to crop image');

            const fileName = `${selectedProfile.id}-${Date.now()}.jpg`;
            const filePath = `avatars/${fileName}`;

            // Upload to 'avatar' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatar')
                .upload(filePath, croppedBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('avatar').getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', selectedProfile.id);

            if (updateError) throw updateError;

            const updated = { ...selectedProfile, avatar_url: publicUrl };
            setSelectedProfile(updated);
            if (selectedProfile.id === myProfile?.id) setMyProfile(updated);
            setProfiles(profiles.map(p => p.id === selectedProfile.id ? updated : p));

            setMessage({ type: 'success', text: `Avatar updated! (${Math.round(croppedBlob.size / 1024)}kB)` });
            setCropImage(null);
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to upload' });
        } finally {
            setUpdating(null);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleUpdateProfile = async () => {
        if (!selectedProfile) return;
        setUpdating('profile');

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                nice_name: niceName,
                username: username,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedProfile.id);

        if (!error) {
            setMessage({ type: 'success', text: 'Profile updated!' });
            const updated = { ...selectedProfile, full_name: fullName, nice_name: niceName, username };
            setSelectedProfile(updated);
            if (selectedProfile.id === myProfile?.id) setMyProfile(updated);
            setProfiles(profiles.map(p => p.id === selectedProfile.id ? updated : p));
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

    const isEditingSelf = selectedProfile?.id === myProfile?.id;

    return (
        <div className="px-4 py-6 max-w-4xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl transition-colors group-hover:bg-primary/10"></div>

                <div className="relative">
                    <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary relative shadow-inner overflow-hidden border border-slate-100 dark:border-slate-800">
                        {myProfile?.avatar_url ? (
                            <img src={myProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} />
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left relative">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-slate-400">Logged in as</p>
                    <h1 className="text-3xl font-black truncate leading-tight dark:text-white">{myProfile?.full_name}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                        <span className="px-3 py-1 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">{myProfile?.role}</span>
                        <span className="text-slate-400 text-sm font-bold flex items-center gap-1">
                            <AtSign size={14} />
                            {myProfile?.username || 'no-username'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Profile Edit Section */}
            <section id="profile-edit-section" className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 scroll-mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            {isEditingSelf ? <UserCircle size={24} /> : <Shield size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black">{isEditingSelf ? 'My Profile' : 'Edit Member'}</h2>
                            {!isEditingSelf && <p className="text-[10px] font-black text-slate-400 uppercase">Editing {selectedProfile?.nice_name}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!isEditingSelf && (
                            <button onClick={() => handleSelectProfile(myProfile!)} className="px-4 py-2.5 rounded-2xl font-black text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2">
                                <X size={16} /> Cancel
                            </button>
                        )}
                        <button
                            onClick={handleUpdateProfile}
                            disabled={updating === 'profile'}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {updating === 'profile' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isEditingSelf ? 'Save My Changes' : 'Update Member'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Upload per profile */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group/avatar">
                            <button
                                onClick={handleAvatarClick}
                                disabled={updating === 'avatar'}
                                className="size-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 relative overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                            >
                                {selectedProfile?.avatar_url ? (
                                    <img src={selectedProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={64} />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                                    {updating === 'avatar' ? <Loader2 size={24} className="animate-spin" /> : <Camera size={32} />}
                                    <span className="text-[8px] font-black uppercase mt-1 tracking-widest text-white">Change Avatar</span>
                                </div>
                            </button>
                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            {updating === 'avatar' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem]">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-slate-400">Full Name</label>
                            <input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary font-medium"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-slate-400">Nice Name</label>
                            <input
                                value={niceName}
                                onChange={(e) => setNiceName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary font-medium"
                                placeholder="Nickname"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-slate-400">Username</label>
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
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-slate-400">Global Gemini Key (Default)</label>
                            <input
                                type="password"
                                value={globalApiKey}
                                onChange={(e) => setGlobalApiKey(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary outline-none font-medium text-xs lg:text-sm"
                                placeholder="Enter global key..."
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-slate-400">Your Personal Gemini Key (Override)</label>
                        <input
                            type="password"
                            value={personalApiKey}
                            onChange={(e) => setPersonalApiKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary outline-none font-medium text-xs lg:text-sm"
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
                        <div
                            key={profile.id}
                            onClick={() => permissions.isAdmin && handleSelectProfile(profile)}
                            className={`
                                p-5 rounded-[2rem] flex items-center justify-between border shadow-sm transition-all
                                ${permissions.isAdmin ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''}
                                ${selectedProfile?.id === profile.id ? 'bg-primary/5 border-primary ring-2 ring-primary/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 overflow-hidden relative">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        profile.full_name?.[0] || '?'
                                    )}
                                    {permissions.isAdmin && (
                                        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                            <Edit3 size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-sm truncate dark:text-white">{profile.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">@{profile.username || 'n/a'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {permissions.isAdmin && profile.id !== myProfile?.id ? (
                                    <select
                                        value={profile.role}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleRoleUpdate(profile.id, e.target.value as UserRole)}
                                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-2 py-1 text-[10px] font-black outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="admin">AD</option>
                                        <option value="member">MB</option>
                                        <option value="kid">KD</option>
                                    </select>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {profile.role?.slice(0, 2)}
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

            {/* Crop Modal */}
            {cropImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-white/10 max-h-[95vh]">
                        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Scissors size={20} />
                                </div>
                                <h1 className="text-xl font-black">Crop Avatar</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleAvatarClick}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
                                >
                                    <Upload size={14} />
                                    Change
                                </button>
                                <button onClick={() => setCropImage(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Cropper Area */}
                            <div className="flex-1 relative bg-slate-900 min-h-[300px] lg:min-h-0">
                                <Cropper
                                    image={cropImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            {/* Preview & Controls Area */}
                            <div className="w-full lg:w-80 bg-slate-50 dark:bg-slate-900/50 border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-8 overflow-y-auto">
                                {/* Preview */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview & Size</p>
                                    <div className="flex items-center gap-6">
                                        <div className="size-20 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-white dark:bg-slate-800 shrink-0">
                                            {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-2xl font-black text-primary">{(previewSize / 1024).toFixed(1)} <span className="text-sm">kB</span></p>
                                            <p className={`text-[10px] font-black uppercase ${previewSize > 20480 ? 'text-orange-500' : 'text-green-500'}`}>
                                                {previewSize > 20480 ? 'Heavy' : 'Super Lean'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Zoom</span>
                                            <span>{Math.round(zoom * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full accent-primary pointer-events-auto"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Quality (Quality vs Size)</span>
                                            <span>{Math.round(quality * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            value={quality}
                                            min={0.1}
                                            max={1.0}
                                            step={0.01}
                                            aria-labelledby="Quality"
                                            onChange={(e) => setQuality(Number(e.target.value))}
                                            className="w-full accent-primary pointer-events-auto"
                                        />
                                    </div>
                                </div>

                                <div className="mt-auto pt-4">
                                    <button
                                        onClick={handleCropSave}
                                        disabled={updating === 'avatar'}
                                        className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {updating === 'avatar' ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Check size={24} />
                                                Done
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
