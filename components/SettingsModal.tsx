import React, { useState, useEffect } from 'react';
import {
  X, Save, Key, Database, RefreshCw, CheckCircle2,
  ShieldAlert, Settings, AlertTriangle, Globe, Lock, FileText
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
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [perfexUrl, setPerfexUrl] = useState('');
  const [perfexToken, setPerfexToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const key = SupabaseService.getGeminiKey();
    if (key) setGeminiKey(key);

    const sUrl = localStorage.getItem('supabase_url') || '';
    const sKey = localStorage.getItem('supabase_key') || '';
    setSupabaseUrl(sUrl);
    setSupabaseKey(sKey);

    // Perfex
    setPerfexUrl(localStorage.getItem('perfex_url') || '');
    setPerfexToken(localStorage.getItem('perfex_token') || '');
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    // Save Gemini Key
    await SupabaseService.saveGeminiKey(geminiKey);

    // Save Supabase Config
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);

    // Save Perfex Config
    localStorage.setItem('perfex_url', perfexUrl);
    localStorage.setItem('perfex_token', perfexToken);

    setTimeout(() => {
      setIsSaving(false);
      // Reload page to apply Supabase changes (since client is initialized at top level)
      if (supabaseUrl || supabaseKey || perfexUrl || perfexToken) {
        window.location.reload();
      }
    }, 1000);
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
          <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 space-y-4 shadow-sm">
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
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700"
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
              O Gemini analisa seus gastos para dar dicas inteligentes. A chave fica salva no seu navegador e no Supabase.
            </p>
          </section>

          {/* Perfex CRM Integration */}
          <section className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-[2rem] border border-red-100 space-y-4 shadow-sm">
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
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Token API</label>
                <input
                  type="password"
                  placeholder="Cole o token aqui..."
                  value={perfexToken}
                  onChange={(e) => setPerfexToken(e.target.value)}
                  className="w-full text-xs font-mono outline-none bg-transparent text-slate-700"
                />
              </div>

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
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <RefreshCw size={14} className={isSaving ? "animate-spin" : ""} />
                {isSaving ? "Sincronizando..." : "Sincronizar Faturas"}
              </button>
            </div>
            <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
              Importa faturas "A vencer", "Vencida" e "Paga" como receitas.
            </p>
          </section>

          {/* Database Section */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} /> Servidor Próprio (aaPanel)
            </h4>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <p className="text-[10px] text-slate-500 font-medium">
                Seus dados estão na memória do navegador. Envie para o novo servidor para salvar com segurança.
              </p>
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const saved = localStorage.getItem('finan_agenda_data_2026_v2');
                    if (saved) {
                      const transactions = JSON.parse(saved);
                      await ApiService.syncLocalDataToCloud(transactions);
                      alert('✅ Sucesso! Seus dados locais foram enviados para o Banco de Dados.');
                      window.location.reload(); // Reload to fetch fresh from DB
                    } else {
                      alert('Nenhum dado local encontrado para enviar.');
                    }
                  } catch (e: any) {
                    alert('❌ Erro ao enviar dados: ' + e.message);
                    console.error(e);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className={isSaving ? "animate-spin" : ""} />
                {isSaving ? "Enviando para o Banco..." : "Sincronizar (Enviar Dados Locais)"}
              </button>

              <button
                onClick={async () => {
                  if (!confirm('ATENÇÃO: Isso apagará TODAS as transações do servidor. Tem certeza?')) return;

                  setIsSaving(true);
                  try {
                    await ApiService.clearAllTransactions();
                    // Também limpar local storage para garantir estado limpo
                    localStorage.removeItem('finan_agenda_data_2026_v2');
                    alert('✅ Todos os dados foram apagados do servidor.');
                    window.location.reload();
                  } catch (e: any) {
                    alert('❌ Erro ao limpar dados: ' + e.message);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <ShieldAlert size={14} />
                {isSaving ? "Apagando..." : "Limpar Dados da Nuvem (Zerar)"}
              </button>
            </div>

            {/* Legacy Supabase (Collapsed or Optional) */}
            <details className="group">
              <summary className="cursor-pointer text-[9px] font-black text-slate-400 uppercase flex items-center gap-2 list-none">
                <Settings size={12} /> Configurações Avançadas (Legado)
              </summary>
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-100">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 flex items-center gap-2">
                    <Globe size={12} /> Supabase URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://xxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full text-xs font-mono outline-none bg-transparent text-slate-700"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 flex items-center gap-2">
                    <Lock size={12} /> Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    placeholder="sua-chave-anon-aqui"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full text-xs font-mono outline-none bg-transparent text-slate-700"
                  />
                </div>
              </div>
            </details>
          </section>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${isSaving ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isSaving ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSaving ? 'Configuração Salva!' : 'Salvar Configurações'}
          </button>

        </div>
      </div>
    </div>
  );
};
