import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface DailyBalanceTableProps {
  transactions: Transaction[];
  previousBalance: number;
  month: number;
  year: number;
}

const WEEKDAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const formatCompactCurrency = (value: number) => {
  if (value === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(value) > 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 0
  }).format(value);
};

export const DailyBalanceTable: React.FC<DailyBalanceTableProps> = ({ transactions, previousBalance, month, year }) => {
  const calendarData = useMemo(() => {
    const days = [];
    let currentAccBalance = previousBalance;

    // 1. Calcular propriedades do mês
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sáb)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 2. Adicionar espaços em branco antes do dia 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, balance: null });
    }

    // 3. Calcular saldos diários e preencher calendário
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTrans = transactions.filter(t => t.day === day);
      const income = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      currentAccBalance = currentAccBalance + income - expense;

      days.push({
        day,
        balance: currentAccBalance
      });
    }

    return days;
  }, [transactions, previousBalance, month, year]);

  return (
    <div className="bg-[#18181b] rounded-3xl overflow-hidden flex flex-col h-full border border-slate-800 shadow-2xl font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between relative z-10">
        <h2 className="font-bold text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          Fevereiro 2026
        </h2>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Positivo
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Negativo
          </div>
        </div>
      </div>

      {/* Cabeçalho da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-800/50 bg-[#18181b]/50 relative z-10">
        {WEEKDAYS_SHORT.map(wd => (
          <div key={wd} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 flex-1 gap-2 p-3 bg-[#18181b] overflow-y-auto relative z-10 custom-scrollbar">
        {calendarData.map((item, idx) => {
          if (item.day === null) {
            return <div key={`empty-${idx}`} className="" />;
          }

          const balance = item.balance ?? 0;
          const isNegative = balance < 0;
          const isToday = new Date().getDate() === item.day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={`day-${item.day}`}
              className={`
                min-h-[90px] rounded-2xl flex flex-col relative group transition-all duration-300 p-2 justify-between border
                ${isToday
                  ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] z-20 scale-[1.02]'
                  : 'bg-[#27272a] border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                }
              `}
            >
              {/* Dia */}
              <div className="flex justify-between items-start">
                <span className={`text-[12px] font-bold ${isToday ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.day}
                </span>
              </div>

              {/* Saldo Principal - HERO */}
              <div className="flex flex-col items-center justify-center -mt-2 flex-1">
                <span className={`text-[13px] md:text-[15px] font-bold tracking-tight ${isNegative ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'}`}>
                  {balance !== null ? formatCompactCurrency(balance) : '...'}
                </span>
              </div>

              {/* Status Dot */}
              <div className="flex justify-center pb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                {/* Decorative logic - maybe a small bar or dot indicating health */}
                <div className={`h-1 w-8 rounded-full ${isNegative ? 'bg-rose-500/50' : 'bg-emerald-500/50'}`}></div>
              </div>

              {/* Tooltip Detalhado */}
              <div className="absolute hidden group-hover:flex bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none flex-col items-center animate-fade-in-up">
                <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] px-4 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700 w-max text-center">
                  <div className="text-slate-400 text-[9px] uppercase tracking-wider mb-1 font-bold">Saldo {item.day}/{month + 1}</div>
                  <div className={`text-base font-black ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/90"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé Resumo */}
      <div className="bg-[#18181b] p-4 border-t border-slate-800 flex justify-between items-center relative z-10">
        <span className="text-[10px] text-slate-500 font-medium hidden md:block">
          Visão Geral Mensal
        </span>
        <div className="text-right flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 ml-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Final:</span>
          <span className={`text-sm font-black ${calendarData[calendarData.length - 1]?.balance < 0 ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'}`}>
            R$ {calendarData[calendarData.length - 1]?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
