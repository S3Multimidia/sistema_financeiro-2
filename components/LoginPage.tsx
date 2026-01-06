import React, { useState } from 'react';
import { ApiService } from '../services/apiService';
import { APP_VERSION } from '../constants';
import { Lock, ShieldCheck, AlertCircle, LogIn, Loader2 } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-100 p-4 rounded-full">
                        <Lock size={40} className="text-indigo-600" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Login Seguro</h1>
                    <p className="text-slate-500 text-sm">
                        Sistema Financeiro v{APP_VERSION}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                            placeholder="Sua senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                        ACESSAR SISTEMA
                    </button>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Ambiente Local Seguro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
