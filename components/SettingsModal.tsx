import React, { useState, useEffect } from 'react';
import {
  X, Save, Key, Database, RefreshCw, CheckCircle2,
  ShieldAlert, Settings, AlertTriangle, Globe, Lock, FileText, Wallet
} from 'lucide-react';
import { Transaction } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { ApiService } from '../services/apiService';
import { PerfexService } from '../services/perfexService';

interface SettingsModalProps {
  onClose: () => void;
  onOpenCategoryManager: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onOpenCategoryManager
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [perfexUrl, setPerfexUrl] = useState('');
  const [perfexToken, setPerfexToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial data
    const loadSettings = async () => {
      const key = await SupabaseService.getGeminiKey();
      if (key) setGeminiKey(key);

      const pUrl = localStorage.getItem('perfex_url') || '';
      const pToken = localStorage.getItem('perfex_token') || '';
      setPerfexUrl(pUrl);
      setPerfexToken(pToken);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    // Save Gemini Key (Try Cloud first, fallback to Local Only)
    if (geminiKey) {
      try {
        await SupabaseService.saveGeminiKey(geminiKey);
      } catch (e) {
        console.warn("Could not save key to Cloud (RLS/Auth issue). Saving locally only.");
        localStorage.setItem('gemini_api_key', geminiKey);
      }
    }

    try {
      // Save Perfex Config
      localStorage.setItem('perfex_url', perfexUrl);
      localStorage.setItem('perfex_token', perfexToken);

      // Force reload to apply changes if needed (API tokens usually require it or context update)
      // For simple UX, we simulate delay and notify.
      await new Promise(r => setTimeout(r, 800));
      alert('Configurações salvas com sucesso!');
      onClose();
      window.location.reload();
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-white/20">
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em]">Configurações do Sistema</h3>
              <p className="text-[9px] font-bold text-white/30 uppercase">Inteligência & Dados</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-2xl transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* Gemini AI Section */}
          <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 space-y-4 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Key size={16} /> Gemini AI (Inteligência)
              </h4>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-inner">
              <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Chave da API (Gemini Cloud)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Cole sua chave API aqui..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                />
              </div>
            </div>
            <p className="text-[9px] text-indigo-600/70 font-medium mt-2 leading-relaxed">
              Necessário para o funcionamento do Chat "Executor" e "Consultor".
            </p>
          </section>

          {/* Perfex CRM Integration */}
          <section className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-[2rem] border border-red-100 space-y-4 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} /> Integração Perfex CRM
              </h4>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-inner space-y-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">URL do CRM</label>
                <input
                  type="text"
                  placeholder="https://admin.s3m.com.br/api"
                  value={perfexUrl}
                  onChange={(e) => setPerfexUrl(e.target.value)}
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Token API</label>
                <input
                  type="password"
                  placeholder="Cole o token aqui..."
                  value={perfexToken}
                  onChange={(e) => setPerfexToken(e.target.value)}
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700 placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      if (!perfexUrl || !perfexToken) {
                        alert('Configure URL e Token primeiro.');
                        setIsSaving(false);
                        return;
                      }
                      await PerfexService.syncInvoicesToSystem({ url: perfexUrl, token: perfexToken });
                      alert('✅ Sincronização com Perfex concluída!');
                      window.location.reload();
                    } catch (e: any) {
                      alert('❌ Erro: ' + e.message);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-[10px] uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={isSaving ? "animate-spin" : ""} />
                  {isSaving ? "Processando..." : "Sincronizar Faturas"}
                </button>

                <button
                  onClick={async () => {
                    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados atuais e sincronizará novamente do Perfex. Continuar?')) return;
                    setIsSaving(true);
                    try {
                      await ApiService.clearAllTransactions();
                      localStorage.removeItem('finan_agenda_data_2026_v2');
                      await PerfexService.syncInvoicesToSystem({ url: perfexUrl, token: perfexToken });
                      alert('✅ Banco limpo e nova sincronização concluída!');
                      window.location.reload();
                    } catch (e: any) {
                      alert('❌ Erro: ' + e.message);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full py-3 bg-white border border-red-100 hover:bg-red-50 text-red-600 rounded-xl font-bold text-[9px] uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldAlert size={14} />
                  Limpar e Ressincronizar (Reset Completo)
                </button>
              </div>
            </div>
          </section>

          {/* Categories Management Section - Added as requested */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => {
            onClose(); // Close settings
            onOpenCategoryManager(); // Open Manager
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Database size={20} className="text-slate-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Categorias e Subcategorias</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Gerencie suas classificações de receitas e despesas</p>
                </div>
              </div>
              <div className="bg-slate-200 p-2 rounded-full text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Settings size={16} />
              </div>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center justify-center gap-3 shadow-xl mt-4 ${isSaving ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isSaving ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>

        </div>
      </div>
    </div>
  );
};
