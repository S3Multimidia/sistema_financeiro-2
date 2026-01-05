import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react';

interface YearlyReportProps {
  transactions: Transaction[];
  year: number;
}

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-xl text-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-100 z-50">
        <p className="font-extrabold mb-3 pb-2 border-b border-slate-200 uppercase tracking-widest text-[10px] text-slate-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }}></div>
              <span className="font-bold text-xs text-slate-600 uppercase">{entry.name}:</span>
            </div>
            <span className="font-mono font-black text-right">{entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const YearlyReport: React.FC<YearlyReportProps> = ({ transactions, year }) => {
  const yearlyData = useMemo(() => {
    const data = MONTHS_NAMES.map((name, index) => {
      const monthTrans = transactions.filter(t => t.month === index && t.year === year);
      const income = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return {
        name,
        Receitas: income,
        Despesas: expense,
        Saldo: income - expense
      };
    });
    return data;
  }, [transactions, year]);

  const totals = useMemo(() => {
    const income = yearlyData.reduce((acc, curr) => acc + curr.Receitas, 0);
    const expense = yearlyData.reduce((acc, curr) => acc + curr.Despesas, 0);
    return { income, expense, balance: income - expense };
  }, [yearlyData]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-8 rounded-[2rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-90 uppercase text-[10px] font-black tracking-widest">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><TrendingUp size={16} /></div>
              Receita Anual {year}
            </div>
            <div className="text-4xl font-black tracking-tight">{formatCurrency(totals.income)}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-8 rounded-[2rem] shadow-xl shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-90 uppercase text-[10px] font-black tracking-widest">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><TrendingDown size={16} /></div>
              Despesa Anual {year}
            </div>
            <div className="text-4xl font-black tracking-tight">{formatCurrency(totals.expense)}</div>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl shadow-slate-900/20 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -mr-12 -mb-12 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 opacity-90 uppercase text-[10px] font-black tracking-widest">
              <div className="p-2 bg-slate-800 rounded-lg border border-slate-700"><DollarSign size={16} className="text-emerald-400" /></div>
              Saldo Consolidado
            </div>
            <div className={`text-4xl font-black tracking-tight ${totals.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formatCurrency(totals.balance)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </div>
            COMPARATIVO ANUAL {year}
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-b from-rose-400 to-rose-600"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Despesas</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData} barGap={8}>
              <defs>
                <linearGradient id="yearIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="yearExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
              <Bar
                dataKey="Receitas"
                fill="url(#yearIncome)"
                radius={[8, 8, 8, 8]}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="Despesas"
                fill="url(#yearExpense)"
                radius={[8, 8, 8, 8]}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-lg">Detalhamento Mensal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Mês</th>
                <th className="px-8 py-5 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Receitas</th>
                <th className="px-8 py-5 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Despesas</th>
                <th className="px-8 py-5 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearlyData.map((m) => (
                <tr key={m.name} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-700 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                    {m.name}
                  </td>
                  <td className="px-8 py-5 text-right text-emerald-600 font-mono font-bold">{formatCurrency(m.Receitas)}</td>
                  <td className="px-8 py-5 text-right text-rose-500 font-mono font-bold">{formatCurrency(m.Despesas)}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`py-1 px-3 rounded-lg font-mono font-bold text-xs ${m.Saldo >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                      {formatCurrency(m.Saldo)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
