import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-background-dark">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
                <div className="text-center space-y-2">
                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">FamilyOS</h1>
                    <p className="text-slate-500 font-medium">Welcome back to your family hub</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                                placeholder="name@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                        Sign In
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default password is 1 for new users</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
