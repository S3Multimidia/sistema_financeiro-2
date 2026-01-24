
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Income */}
      <div className="group glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp size={80} className="text-emerald-500 transform rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/30">
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receitas</p>
          </div>

          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{formatCurrency(summary.realizedIncome)}</h3>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Realizado
            </span>
            <span className="text-xs text-slate-400">
              de {formatCurrency(summary.totalIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Expense */}
      <div className="group glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingDown size={80} className="text-rose-500 transform -rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl text-white shadow-lg shadow-rose-500/30">
              <ArrowDownRight size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Despesas</p>
          </div>

          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{formatCurrency(summary.realizedExpense)}</h3>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
              Realizado
            </span>
            <span className="text-xs text-slate-400">
              de {formatCurrency(summary.totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Current Balance */}
      <div className="group glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-primary-500/10 border-primary-100">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet size={80} className="text-primary-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl text-white shadow-lg shadow-primary-500/30">
              <Wallet size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">Saldo em Caixa</p>
          </div>

          <h3 className={`text-3xl font-bold tracking-tight ${summary.currentBalance >= 0 ? 'text-primary-900' : 'text-rose-600'}`}>
            {formatCurrency(summary.currentBalance)}
          </h3>
          <p className="text-xs text-primary-400 mt-2 font-medium">
            Disponível agora
          </p>
        </div>
      </div>

      {/* End of Month Forecast */}
      <div className="group glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CalendarCheck size={80} className="text-purple-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl text-white shadow-lg shadow-slate-500/30">
              <CalendarCheck size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previsão</p>
          </div>

          <h3 className={`text-3xl font-bold tracking-tight ${summary.endOfMonthBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatCurrency(summary.endOfMonthBalance)}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Projetado para fim do mês
          </p>
        </div>
      </div>
    </div>
  );
};
