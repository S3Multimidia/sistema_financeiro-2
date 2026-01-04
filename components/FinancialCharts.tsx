
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Transaction } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl text-xs shadow-2xl border border-white/10 z-50">
        <p className="font-black mb-2 pb-1 border-b border-white/10 uppercase tracking-widest opacity-60">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
              <span className="font-bold opacity-80">{entry.name}:</span>
            </div>
            <span className="font-mono font-black text-right">R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo Diário do Mês</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Despesas</span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dailyData}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            barGap={4}
          >
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
              tickFormatter={(value: number) => `R$${value >= 1000 ? (value/1000)+'k' : value}`} 
              tickLine={false} 
              axisLine={false} 
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} animationDuration={1500} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
