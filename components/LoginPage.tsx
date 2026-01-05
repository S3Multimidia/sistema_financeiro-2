import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { ALLOWED_EMAILS, AUTO_CONFIG_URL, APP_VERSION } from '../constants';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState<string | null>(null);

    const handleSuccess = (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) {
                throw new Error('Falha ao receber credenciais do Google.');
            }

            const decoded: any = jwtDecode(credentialResponse.credential);
            const email = decoded.email;

            if (!ALLOWED_EMAILS.includes(email)) {
                setError(`Acesso negado para o email: ${email}. Contate o administrador.`);
                return;
            }

            // Auto-configuração da URL do Script
            const currentUrl = localStorage.getItem('google_sheets_url');
            if (currentUrl !== AUTO_CONFIG_URL) {
                localStorage.setItem('google_sheets_url', AUTO_CONFIG_URL);
                localStorage.setItem('finan_auto_sync', 'true');
                console.log("✅ Configuração automática aplicada com sucesso.");
            }

            onLoginSuccess(decoded);
        } catch (err) {
            console.error('Login Error:', err);
            setError('Ocorreu um erro ao processar seu login.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-100 p-4 rounded-full">
                        <Lock size={40} className="text-indigo-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Acesso Restrito</h1>
                <p className="text-slate-500 mb-8 text-sm">
                    Faça login com sua conta Google autorizada para acessar o Sistema Financeiro v{APP_VERSION}.
                </p>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-left">
                        <AlertCircle size={20} className="shrink-0" />
                        <span className="text-xs font-bold leading-tight">{error}</span>
                    </div>
                )}

                <div className="flex justify-center mb-8">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => setError('Falha na conexão com o Google.')}
                        theme="filled_blue"
                        shape="pill"
                        size="large"
                        text="signin_with"
                    />
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Ambiente Seguro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
