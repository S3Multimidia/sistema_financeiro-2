import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Transaction } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md text-slate-700 p-4 rounded-2xl text-sm shadow-xl border border-white/20 z-50 ring-1 ring-slate-900/5">
        <p className="font-extrabold mb-3 pb-2 border-b border-slate-100 uppercase tracking-widest text-[10px] text-slate-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-8 mb-2 last:mb-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ background: entry.fill }} // Use the gradient fill
              ></div>
              <span className="font-bold opacity-80 text-xs uppercase tracking-wide">{entry.name}</span>
            </div>
            <span className="font-mono font-black text-right text-slate-800">
              R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartProps {
  transactions: Transaction[];
}

export const DailyFlowChart: React.FC<ChartProps> = ({ transactions }) => {
  const dailyData = useMemo(() => {
    const data: any[] = [];
    const days = Array.from(new Set(transactions.map(t => t.day))).sort((a: number, b: number) => a - b);

    days.forEach(day => {
      const dayTrans = transactions.filter(t => t.day === day);
      const income = dayTrans.filter(t => t.type === 'income').reduce((acc: number, c: Transaction) => acc + c.amount, 0);
      const expense = dayTrans.filter(t => t.type === 'expense').reduce((acc: number, c: Transaction) => acc + c.amount, 0);
      data.push({
        name: `Dia ${day}`,
        Receitas: income,
        Despesas: expense,
      });
    });
    return data;
  }, [transactions]);

  return (
    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100/80 hover:shadow-lg transition-all duration-500 h-full flex flex-col group">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-500 transition-colors">Fluxo Diário do Mês</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50 shadow-sm"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-rose-500/50 shadow-sm"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Despesas</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dailyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
              tickFormatter={(value: number) => `R$${value >= 1000 ? (value / 1000) + 'k' : value}`}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
            <Bar
              dataKey="Receitas"
              fill="url(#colorIncome)"
              radius={[6, 6, 6, 6]}
              maxBarSize={32}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="Despesas"
              fill="url(#colorExpense)"
              radius={[6, 6, 6, 6]}
              maxBarSize={32}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
