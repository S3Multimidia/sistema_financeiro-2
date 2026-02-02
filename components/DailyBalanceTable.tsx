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
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-full border border-white/50 shadow-xl">
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
          Saldo Diário Previsto
        </h2>
        <div className="flex gap-3 text-[9px] font-bold uppercase tracking-wide">
          <div className="flex items-center gap-1 text-emerald-600">
            <div className="w-1.5 h-1.5 rounded-sm bg-emerald-100 border border-emerald-200"></div> Positivo
          </div>
          <div className="flex items-center gap-1 text-rose-600">
            <div className="w-1.5 h-1.5 rounded-sm bg-rose-100 border border-rose-200"></div> Negativo
          </div>
        </div>
      </div>

      {/* Cabeçalho da Semana */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200/50">
        {WEEKDAYS_SHORT.map(wd => (
          <div key={wd} className="py-2 text-center text-[9px] font-black text-slate-400">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 flex-1 bg-slate-100/50 gap-px p-px">
        {calendarData.map((item, idx) => {
          if (item.day === null) {
            return <div key={`empty-${idx}`} className="bg-slate-50/30" />;
          }

          const isNegative = item.balance !== null && item.balance < 0;
          const isToday = new Date().getDate() === item.day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={`day-${item.day}`}
              className={`min-h-[60px] flex flex-col items-center justify-center relative group transition-all duration-200 
                ${isNegative ? 'bg-rose-50/60 hover:bg-rose-100/80' : 'bg-white hover:bg-indigo-50/50'}
                ${isToday ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}
              `}
            >
              <div className="absolute top-1 left-1.5">
                <span className={`text-[10px] font-bold font-mono ${isToday ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {item.day}
                </span>
              </div>

              <div className="flex flex-col items-center z-0 pt-3">
                <span className={`text-[11px] font-black tracking-tight ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {item.balance !== null ? formatCompactCurrency(item.balance) : ''}
                </span>
              </div>

              {/* Tooltip Detalhado */}
              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-bold whitespace-nowrap">
                  R$ {item.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé Resumo */}
      <div className="bg-white p-3 border-t border-slate-100 flex justify-end">
        <div className="text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase mr-2">Fechamento:</span>
          <span className={`text-xs font-black ${calendarData[calendarData.length - 1]?.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            R$ {calendarData[calendarData.length - 1]?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
