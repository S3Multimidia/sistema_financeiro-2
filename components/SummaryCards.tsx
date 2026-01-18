
import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, CalendarCheck, TrendingUp, TrendingDown, Pencil, Check, X } from 'lucide-react';
import { MonthSummary } from '../types';

interface SummaryCardsProps {
  summary: MonthSummary & { label?: string };
  onUpdateStartingBalance: (value: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onUpdateStartingBalance }) => {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(summary.previousBalance.toString());

  const handleSaveBalance = () => {
    // Replace commas and handle possible multiple decimals if user pastes mess
    const clean = tempBalance.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(clean);

    if (!isNaN(val)) {
      onUpdateStartingBalance(Number(val.toFixed(2)));
    }
    setIsEditingBalance(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Saldo Anterior (Editável) */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative">
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            Saldo Anterior
          </p>

          {isEditingBalance ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                autoFocus
                className="w-full bg-slate-50 border border-indigo-200 rounded px-2 py-0.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400"
                value={tempBalance}
                onChange={(e) => setTempBalance(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveBalance()}
                placeholder="0,00"
              />
              <button onClick={handleSaveBalance} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded transition-colors"><Check size={14} /></button>
              <button onClick={() => setIsEditingBalance(false)} className="text-rose-400 hover:bg-rose-50 p-1 rounded transition-colors"><X size={14} /></button>
            </div>
          ) : (
            <h3 className="text-xl font-bold text-slate-700">{formatCurrency(summary.previousBalance)}</h3>
          )}
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
          <Wallet size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Income */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Receitas (Mês)</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</h3>
            <TrendingUp size={12} className="text-emerald-400" />
          </div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
          <ArrowUpRight size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Expense */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <div>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Despesas (Mês)</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-xl font-bold text-rose-600">{formatCurrency(summary.totalExpense)}</h3>
            <TrendingDown size={12} className="text-rose-400" />
          </div>
        </div>
        <div className="p-3 bg-rose-50 rounded-xl text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
          <ArrowDownRight size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* End of Month Balance */}
      <div className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previsão Fechamento</p>
          <h3 className={`text-xl font-bold ${summary.endOfMonthBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatCurrency(summary.endOfMonthBalance)}
          </h3>
        </div>
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
          <CalendarCheck size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};
