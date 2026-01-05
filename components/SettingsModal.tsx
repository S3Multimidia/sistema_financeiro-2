import React, { useState, useEffect } from 'react';
import {
  X, Save, Key, Database, RefreshCw, CheckCircle2,
  ShieldAlert, Settings, AlertTriangle
} from 'lucide-react';
import { Transaction } from '../types';
import { SupabaseService } from '../services/supabaseService';

interface SettingsModalProps {
  onClose: () => void;
  onOpenCategoryManager: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onOpenCategoryManager
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const key = SupabaseService.getGeminiKey();
    if (key) setGeminiKey(key);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await SupabaseService.saveGeminiKey(geminiKey);
    setTimeout(() => setIsSaving(false), 1000);
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
              O Gemini analisa seus gastos para dar dicas inteligentes. A chave fica salva apenas no seu navegador.
            </p>
          </section>

          {/* Database Section */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <Database size={16} /> Banco de Dados (Supabase)
            </h4>
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-xs font-black text-slate-700">Conectado ao Cloud</p>
                <p className="text-[9px] font-bold text-slate-400">Sincronização em tempo real ativa</p>
              </div>
            </div>

            {/* Migration/Sync Placeholder */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
              <AlertTriangle size={20} className="text-orange-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Migração de Dados</p>
                <p className="text-[9px] text-orange-700/80 font-bold leading-tight">
                  Seus dados antigos do Planilhas Google precisam ser importados manualmente se ainda não estiverem aqui.
                </p>
              </div>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center justify-center gap-3 shadow-xl ${isSaving ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
          >
            {isSaving ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSaving ? 'Configuração Salva!' : 'Salvar Configurações'}
          </button>

        </div>
      </div>
    </div>
  );
};
