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
    compactDisplay: 'short',
    maximumFractionDigits: 0
  }).format(value);
};

// Feriados Nacionais 2026 (Brasil)
const HOLIDAYS_2026: Record<string, string> = {
  '1-1': 'Confraternização',
  '17-2': 'Carnaval',
  '3-4': 'Paixão de Cristo',
  '21-4': 'Tiradentes',
  '1-5': 'Dia do Trabalho',
  '4-6': 'Corpus Christi',
  '7-9': 'Independência',
  '12-10': 'N. Sra. Aparecida',
  '2-11': 'Finados',
  '15-11': 'Proclamação Rep.',
  '20-11': 'Consciência Negra',
  '25-12': 'Natal'
};

export const DailyBalanceTable: React.FC<DailyBalanceTableProps> = ({ transactions, previousBalance, month, year }) => {
  const calendarData = useMemo(() => {
    const days = [];
    let currentAccBalance = previousBalance;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sáb)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Fill empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, balance: null, income: 0, expense: 0 });
    }

    // Fill days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTrans = transactions.filter(t => t.day === day);
      const income = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      currentAccBalance = currentAccBalance + income - expense;

      days.push({
        day,
        balance: currentAccBalance,
        income,
        expense
      });
    }

    return days;
  }, [transactions, previousBalance, month, year]);

  const finalBalance = calendarData.length > 0 ? calendarData[calendarData.length - 1]?.balance : 0;

  return (
    <div className="finance-calendar font-sans">

      {/* HEADER */}
      <div className="finance-calendar__header">
        <div className="finance-calendar__title">
          <div className="finance-calendar__dot"></div>
          {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>

        <div className="finance-calendar__controls">
          <div className="finance-calendar__pill hidden sm:block">
            Visão Analítica
          </div>
          <div className="finance-calendar__pill hidden sm:block">
            Visão Executiva
          </div>
        </div>
      </div>

      {/* WEEKDAYS */}
      <div className="calendar-grid mb-1">
        {WEEKDAYS_SHORT.map((wd, index) => (
          <div key={wd} className={`calendar-weekday ${index === 0 || index === 6 ? 'opacity-50' : ''}`}>
            {wd}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="calendar-grid content-start">
        {calendarData.map((item, idx) => {
          if (item.day === null) {
            return <div key={`empty-${idx}`} className="" />;
          }

          const balance = item.balance ?? 0;
          const dateObj = new Date(year, month, item.day);

          const isToday = new Date().getDate() === item.day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          const holidayKey = `${item.day}-${month + 1}`;
          const holidayName = HOLIDAYS_2026[holidayKey];

          // Determine State Class
          let stateClass = '';
          if (balance > 0) stateClass += ' is-positive';
          else if (balance < 0) stateClass += ' is-negative';

          if (isToday) stateClass += ' is-today';
          if (isWeekend) stateClass += ' is-weekend';
          if (holidayName) stateClass += ' is-event';

          return (
            <div key={`day-${item.day}`} className={`calendar-day ${stateClass} group`}>

              {/* NUMBER Top Left/Right */}
              <div className="flex justify-between items-start">
                <span className="calendar-day__num">{item.day}</span>
              </div>

              {/* HOLIDAY */}
              {holidayName && (
                <div className="calendar-day__holiday">
                  {holidayName}
                </div>
              )}

              {/* VALUE Bottom Right */}
              <span className="calendar-day__value">
                {balance !== null ? formatCompactCurrency(balance) : '-'}
              </span>

              {/* TOOLTIP */}
              <div className="calendar-tooltip">
                <div className="calendar-tooltip__title">
                  {new Date(year, month, item.day).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="calendar-tooltip__row">
                  <span>Entradas</span>
                  <span className="text-green">+ R$ {item.income?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="calendar-tooltip__row">
                  <span>Saídas</span>
                  <span className="text-red">- R$ {item.expense?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="calendar-tooltip__row border-t border-white/10 mt-1 pt-1">
                  <b>Resultado do Dia</b>
                  <b className={balance >= 0 ? 'text-green' : 'text-red'}>
                    {balance >= 0 ? '+' : ''} R$ {balance?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </b>
                </div>
                <div className="mt-2 text-[9px] text-center bg-white/5 rounded py-1 cursor-pointer hover:bg-white/10 transition-colors uppercase font-bold tracking-wider text-white/50">
                  Ver lançamentos
                </div>
              </div>

            </div>
          );
        })}

        {/* Fillers */}
        {Array.from({ length: (7 - (calendarData.length % 7)) % 7 }).map((_, i) => (
          <div key={`end-pad-${i}`} />
        ))}
      </div>

      {/* FOOTER */}
      {/* FOOTER */}
      <div className="flex justify-between items-center mt-6 pt-5 border-t border-[color:var(--cal-border)] mx-1 relative z-20">
        <span className="text-[11px] font-medium" style={{ color: 'var(--cal-muted)' }}>
          Fechamento Estimado
        </span>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--cal-dim)' }}>SALDO FINAL:</span>
          <span
            className="text-lg font-black tracking-tight"
            style={{
              color: finalBalance >= 0 ? 'var(--cal-green)' : 'var(--cal-red)',
              textShadow: finalBalance >= 0 ? '0 0 20px rgba(16,185,129,0.4)' : '0 0 20px rgba(239,68,68,0.4)'
            }}
          >
            {finalBalance >= 0 ? '+' : ''} R$ {finalBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

    </div>
  );
};
