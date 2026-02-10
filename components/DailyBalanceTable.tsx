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

// Feriados Nacionais 2026 (Brasil)
const HOLIDAYS_2026: Record<string, string> = {
  '1-1': 'Confraternização Universal',
  '17-2': 'Carnaval',
  '3-4': 'Paixão de Cristo',
  '21-4': 'Tiradentes',
  '1-5': 'Dia do Trabalho',
  '4-6': 'Corpus Christi',
  '7-9': 'Independência',
  '12-10': 'N. Sra. Aparecida',
  '2-11': 'Finados',
  '15-11': 'Proclamação da Rep.',
  '20-11': 'Consciência Negra',
  '25-12': 'Natal'
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
    <div className="bg-[#18181b] rounded-3xl overflow-hidden flex flex-col h-auto border border-slate-800 shadow-2xl font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between relative z-10 shrink-0">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>

        {/* Header Summary for Immediate Match */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fechamento</div>
            <div className={`text-xs font-black ${calendarData.length > 0 && calendarData[calendarData.length - 1]?.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {calendarData.length > 0 && calendarData[calendarData.length - 1]?.balance !== null
                ? formatCompactCurrency(calendarData[calendarData.length - 1].balance!)
                : 'R$ 0,00'}
            </div>
          </div>

          <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wide">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> <span className="hidden xl:inline">Positivo</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> <span className="hidden xl:inline">Negativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-800/50 bg-[#18181b]/50 relative z-10 shrink-0">
        {WEEKDAYS_SHORT.map((wd, index) => (
          <div key={wd} className={`py-1.5 text-center text-[9px] font-bold uppercase tracking-widest ${index === 0 || index === 6 ? 'text-amber-500/70' : 'text-slate-500'}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 gap-1 p-2 bg-[#18181b] relative z-10 content-start">
        {calendarData.map((item, idx) => {
          if (item.day === null) {
            return <div key={`empty-${idx}`} className="" />;
          }

          const balance = item.balance ?? 0;
          const isNegative = balance < 0;
          const dateObj = new Date(year, month, item.day);
          const isToday = new Date().getDate() === item.day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0=Dom, 6=Sab
          const holidayKey = `${item.day}-${month + 1}`;
          const holidayName = HOLIDAYS_2026[holidayKey];

          return (
            <div
              key={`day-${item.day}`}
              className={`
                min-h-[42px] rounded-lg flex flex-col relative group transition-all duration-300 px-1 py-0.5 justify-center border
                ${isToday
                  ? 'bg-slate-800 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)] z-20 scale-[1.05]'
                  : isWeekend
                    ? 'bg-[#202024] border-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    : 'bg-[#27272a] border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${isToday ? 'text-cyan-400' : isWeekend ? 'text-amber-500/70' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.day}
                </span>

                <span className={`text-[10px] sm:text-[11px] font-black tracking-tight ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {balance !== null ? formatCompactCurrency(balance) : '-'}
                </span>
              </div>

              {/* Holiday Name */}
              {holidayName && (
                <div className="text-[7px] font-bold text-amber-400/80 uppercase truncate mt-0.5 text-center leading-tight">
                  {holidayName}
                </div>
              )}

              {/* Tooltip Detalhado */}
              <div className="absolute hidden group-hover:flex bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 pointer-events-none flex-col items-center animate-fade-in-up">
                <div className="bg-slate-900/95 backdrop-blur-md text-white text-[10px] px-2 py-1.5 rounded-lg shadow-xl border border-slate-700 w-max text-center z-50">
                  <div className={`text-xs font-black ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {holidayName && <div className="text-amber-400 mt-1 uppercase font-bold text-[9px]">{holidayName}</div>}
                </div>
              </div>
            </div>
          );
        })}
        {/* End Padding to fill grid if needed */}
        {Array.from({ length: (7 - (calendarData.length % 7)) % 7 }).map((_, i) => (
          <div key={`end-pad-${i}`} className="" />
        ))}
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
