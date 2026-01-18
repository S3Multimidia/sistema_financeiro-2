
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
  const prefix = 'R$ ';
  if (Math.abs(value) >= 1000) {
    return prefix + (value / 1000).toFixed(1) + 'k';
  }
  return prefix + Math.round(value);
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-900 text-white p-4">
        <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-center">Calendário de Saldo Acumulado</h2>
      </div>

      {/* Cabeçalho da Semana */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
        {WEEKDAYS_SHORT.map(wd => (
          <div key={wd} className="py-2 text-center text-[8px] font-black text-slate-400">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 flex-1 bg-slate-100 gap-px">
        {calendarData.map((item, idx) => {
          if (item.day === null) {
            return <div key={`empty-${idx}`} className="bg-slate-50/50" />;
          }

          const isNegative = item.balance !== null && item.balance < 0;
          const isToday = new Date().getDate() === item.day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={`day-${item.day}`}
              className={`bg-white p-1 min-h-[60px] flex flex-col justify-between transition-colors hover:bg-slate-50 relative group ${isToday ? 'ring-1 ring-inset ring-indigo-500 z-10' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {item.day.toString().padStart(2, '0')}
                </span>
                {isToday && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
              </div>

              <div className="flex flex-col items-center justify-center flex-1">
                <span className={`text-[10px] font-black leading-tight mb-1 text-center break-all ${isNegative ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {item.balance !== null ? formatCompactCurrency(item.balance) : ''}
                </span>
                <div className={`w-full h-[3px] rounded-full opacity-20 ${isNegative ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
              </div>

              {/* Tooltip Simples ao passar o mouse */}
              <div className="absolute hidden group-hover:flex bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded mb-1 whitespace-nowrap z-50 pointer-events-none font-bold shadow-xl border border-white/10">
                Saldo: R$ {item.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 p-3 border-t border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase">Positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase">Negativo</span>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase">Final do Mês</p>
            <p className={`text-[11px] font-black ${calendarData[calendarData.length - 1]?.balance < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
              R$ {calendarData[calendarData.length - 1]?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
