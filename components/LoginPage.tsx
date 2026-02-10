import React, { useState } from 'react';
import { ApiService } from '../services/apiService';
import { APP_VERSION } from '../constants';
import { Lock, Mail, Key, ShieldCheck, AlertCircle, LogIn, Loader2, Sparkles, TrendingUp, Wallet, LayoutDashboard } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('financeiro@s3m.com.br');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await ApiService.login(email, password);
            onLoginSuccess(data.user);
        } catch (err: any) {
            console.error('Login Error:', err);
            setError('Credenciais inválidas. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden font-sans">
            {/* Left Side: Branding & Visuals */}
            <div className="hidden lg:flex lg:w-3/5 bg-slate-950 relative overflow-hidden items-center justify-center p-12">
                {/* Mesh Gradients / Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-rose-500/10 blur-[100px] rounded-full animate-pulse delay-1000"></div>

                <div className="relative z-10 max-w-xl text-center">
                    {/* Stylized S3 Logo */}
                    <div className="flex justify-center mb-10 group cursor-default">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Metallic Border Circle */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-300 via-slate-500 to-slate-200 p-1">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                    {/* Red Triangle Background */}
                                    <div
                                        className="absolute w-24 h-24 bg-rose-600 rotate-45 transform translate-x-4 translate-y-4 rounded-lg opacity-90 group-hover:scale-110 transition-transform duration-500"
                                        style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
                                    ></div>
                                    <span className="relative z-10 text-4xl font-black italic tracking-tighter flex items-center">
                                        <span className="text-white">S</span>
                                        <span className="text-slate-400">3</span>
                                    </span>
                                </div>
                            </div>
                            {/* Outer Glow */}
                            <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500"></div>
                        </div>
                    </div>

                    <h1 className="text-5xl font-black text-white mb-6 uppercase tracking-tight leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">S3 Multimídia</span>
                        <br />
                        <span className="text-2xl font-bold text-indigo-400 tracking-[0.2em] opacity-80 mt-2 block">Financeiro Pro</span>
                    </h1>

                    <div className="grid grid-cols-3 gap-6 mt-12">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <TrendingUp className="text-emerald-400 mb-2 mx-auto" size={20} />
                            <p className="text-[10px] font-black uppercase text-slate-300">Análise Real</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <Wallet className="text-indigo-400 mb-2 mx-auto" size={20} />
                            <p className="text-[10px] font-black uppercase text-slate-300">Gestão Fácil</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <LayoutDashboard className="text-violet-400 mb-2 mx-auto" size={20} />
                            <p className="text-[10px] font-black uppercase text-slate-300">Total Dashboard</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-12">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={12} className="text-indigo-500" /> Powered by Vibe Code
                    </span>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-2/5 bg-white flex flex-col items-center justify-center p-8 md:p-16 relative">
                {/* Mobile Logo Only */}
                <div className="lg:hidden mb-12 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center relative shadow-xl overflow-hidden mb-4">
                        <div className="absolute w-14 h-14 bg-rose-600 rotate-45 transform translate-x-2 translate-y-2 rounded-lg opacity-90" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
                        <span className="relative z-10 text-2xl font-black italic tracking-tighter text-white">S3</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">S3 Multimídia</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Financeiro Pro</span>
                </div>

                <div className="w-full max-w-sm">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 justify-center lg:justify-start">
                            <Lock size={28} className="text-indigo-600" /> Login
                        </h2>
                        <p className="text-slate-500 mt-2 font-medium">Bem-vindo de volta! Acesse sua conta.</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 text-sm animate-shake">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="font-bold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 group-focus-within:text-indigo-600 transition-colors">E-mail Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="financeiro@s3m.com.br"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 group-focus-within:text-indigo-600 transition-colors">Senha de Acesso</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Lembrar-me</span>
                            </label>
                            <button type="button" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-all">Esqueceu a senha?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {loading ? <Loader2 size={22} className="animate-spin" /> : <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />}
                            ACESSAR SISTEMA
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 inline-flex items-center gap-3 transition-all hover:bg-white hover:shadow-sm">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <div className="flex flex-col items-start translate-y-[1px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status do Sistema</span>
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Ambiente 100% Protegido</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 text-[10px] font-bold text-slate-300">
                    S3 Financeiro — v{APP_VERSION}
                </div>
            </div>
        </div>
    );
};
