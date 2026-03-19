import React from 'react';
import { 
  CloudCheck, 
  Loader2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  CalendarCheck, 
  Wallet, 
  Calculator as CalculatorIcon, 
  Sparkles, 
  Settings, 
  RefreshCw 
} from 'lucide-react';
import { ApiService } from '../services/apiService';

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface HeaderProps {
  appConfig: { appName: string };
  cloudStatus: 'idle' | 'syncing' | 'error' | 'ok';
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  undoHistory: any[];
  handleUndo: () => void;
  summary: {
    previousBalance: number;
    realizedIncome: number;
    totalIncome: number;
    realizedExpense: number;
    totalExpense: number;
    endOfMonthBalance: number;
    currentBalance: number;
    currentExpectedBalance: number;
  };
  setShowCalculator: (show: boolean) => void;
  setShowChat: (show: boolean) => void;
  currentView: 'dashboard' | 'yearly';
  setCurrentView: (view: 'dashboard' | 'yearly') => void;
  loadFromCloud: () => void;
  setShowSettings: (show: boolean) => void;
  setUser: (user: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  appConfig,
  cloudStatus,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear,
  undoHistory,
  handleUndo,
  summary,
  setShowCalculator,
  setShowChat,
  currentView,
  setCurrentView,
  loadFromCloud,
  setShowSettings,
  setUser
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-100/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300 h-16">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">

        {/* Left: Logo & Month Nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center relative group">
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold text-slate-900 leading-none uppercase tracking-tight">{appConfig.appName}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {cloudStatus === 'ok' && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100"><CloudCheck size={10} /> Sync On</span>}
                {cloudStatus === 'syncing' && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-100"><Loader2 size={10} className="animate-spin" /> Saving</span>}
                {cloudStatus === 'error' && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-100"><AlertTriangle size={10} /> Error</span>}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200/80 hidden md:block"></div>

          {/* Date Navigation */}
          <div className="flex items-center bg-slate-100/80 rounded-lg p-1 border border-slate-200/50">
            <button onClick={() => { const d = new Date(currentYear, currentMonth - 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft size={16} /></button>
            <div className="px-3 text-center min-w-[90px]">
              <span className="text-xs font-black text-slate-700 uppercase block leading-none">{MONTHS_NAMES[currentMonth]}</span>
              <span className="text-[10px] font-bold text-slate-400 leading-none">{currentYear}</span>
            </div>
            <button onClick={() => { const d = new Date(currentYear, currentMonth + 1); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }} className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Center: Undo Button */}
        <div className="flex-1 flex justify-center">
          {undoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 font-bold uppercase text-[10px] rounded-full hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group animate-in slide-in-from-top-2"
              title="Desfazer última ação (Ctrl+Z)"
            >
              <div className="bg-slate-100 p-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <LogOut size={12} className="transform rotate-180" />
              </div>
              <span>Desfazer</span>
            </button>
          )}
        </div>

        {/* Center: Financial Stats */}
        <div className="flex-1 max-w-5xl hidden lg:flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-[22px] border border-white/40 shadow-sm backdrop-blur-md">

            {/* Saldo Inicial */}
            <div className="flex flex-col px-5 py-2 bg-white/60 hover:bg-white/90 transition-all rounded-2xl border border-white/60 min-w-[130px] shadow-sm group">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Saldo Inicial
              </span>
              <span className="text-[15px] font-black text-slate-800 leading-tight">
                {summary.previousBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Base Anterior</span>
            </div>

            {/* Receitas */}
            <div className="flex flex-col px-5 py-2 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all rounded-2xl border border-emerald-100/50 min-w-[150px] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 blur-2xl rounded-full"></div>
              <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-[0.1em] flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Receitas
              </span>
              <span className="text-[15px] font-black text-slate-800 leading-tight">
                {summary.realizedIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black text-emerald-600 leading-none">
                  + {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">total</span>
              </div>
            </div>

            {/* Despesas */}
            <div className="flex flex-col px-5 py-2 bg-rose-50/40 hover:bg-rose-50/80 transition-all rounded-2xl border border-rose-100/50 min-w-[150px] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 blur-2xl rounded-full"></div>
              <span className="text-[9px] font-black text-rose-600/70 uppercase tracking-[0.1em] flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Despesas
              </span>
              <span className="text-[15px] font-black text-slate-800 leading-tight">
                {summary.realizedExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black text-rose-600 leading-none">
                  - {summary.totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">total</span>
              </div>
            </div>

            {/* Saldo Previsto */}
            <div className="flex flex-col px-5 py-2 bg-violet-600 text-white rounded-2xl border border-violet-500 min-w-[160px] shadow-lg shadow-violet-600/20 active:scale-95 transition-all cursor-default relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl rounded-full group-hover:bg-white/20 transition-all"></div>
              <span className="text-[9px] font-black text-violet-100 uppercase tracking-[0.13em] flex items-center gap-2 mb-1">
                <CalendarCheck size={10} strokeWidth={3} className="text-violet-200" /> Saldo Previsto
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-black leading-none tracking-tight">
                  {summary.endOfMonthBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] font-bold text-violet-300 uppercase tracking-tighter">FECHAMENTO DO MÊS</span>
                </div>
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="flex flex-col px-5 py-2 bg-indigo-600 text-white rounded-2xl border border-indigo-500 min-w-[160px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-default relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl rounded-full group-hover:bg-white/20 transition-all"></div>
              <span className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.13em] flex items-center gap-2 mb-1">
                <Wallet size={10} strokeWidth={3} className="text-indigo-200" /> Saldo Atual
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-black leading-none tracking-tight">
                  {summary.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-black text-indigo-200 leading-none">
                    {summary.currentExpectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter">PREVISÃO DO DIA</span>
                </div>
              </div>
            </div>

          </div>

          {/* Calculadora */}
          <button
            onClick={() => setShowCalculator(true)}
            className="group relative flex items-center justify-center p-0.5"
            title="Abrir Calculadora"
          >
            <div className="absolute inset-0 bg-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-indigo-400 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all duration-300">
              <CalculatorIcon size={22} strokeWidth={2.5} />
            </div>
          </button>

          {/* Agente Inteligente AI */}
          <button
            onClick={() => setShowChat(true)}
            className="group relative flex items-center justify-center p-0.5"
            title="Agente Inteligente IA"
          >
            <div className="absolute inset-0 bg-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-xl shadow-violet-600/30 border border-violet-400 hover:bg-violet-500 hover:scale-105 active:scale-95 transition-all duration-300">
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 mr-2">
            <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Dashboard</button>
            <button onClick={() => setCurrentView('yearly')} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${currentView === 'yearly' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Relatórios</button>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button onClick={() => loadFromCloud()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Recarregar">
              <RefreshCw size={18} />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Configurações">
              <Settings size={18} />
            </button>
            <button onClick={() => { ApiService.logout(); setUser(null); }} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
