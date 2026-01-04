
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface YearlyReportProps {
  transactions: Transaction[];
  year: number;
}

const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-900/20">
          <div className="flex items-center gap-3 mb-2 opacity-80 uppercase text-[10px] font-black">
            <TrendingUp size={16} /> Receita Anual {year}
          </div>
          <div className="text-3xl font-black">{formatCurrency(totals.income)}</div>
        </div>
        <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-lg shadow-rose-900/20">
          <div className="flex items-center gap-3 mb-2 opacity-80 uppercase text-[10px] font-black">
            <TrendingDown size={16} /> Despesa Anual {year}
          </div>
          <div className="text-3xl font-black">{formatCurrency(totals.expense)}</div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg shadow-slate-900/20">
          <div className="flex items-center gap-3 mb-2 opacity-80 uppercase text-[10px] font-black">
            <DollarSign size={16} /> Saldo Consolidado
          </div>
          <div className="text-3xl font-black">{formatCurrency(totals.balance)}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> COMPARATIVO MENSAL
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-black text-slate-500 uppercase text-[10px]">Mês</th>
              <th className="px-6 py-4 text-right font-black text-emerald-600 uppercase text-[10px]">Receitas</th>
              <th className="px-6 py-4 text-right font-black text-rose-600 uppercase text-[10px]">Despesas</th>
              <th className="px-6 py-4 text-right font-black text-slate-800 uppercase text-[10px]">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yearlyData.map((m) => (
              <tr key={m.name} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-700">{m.name}</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-mono">{formatCurrency(m.Receitas)}</td>
                <td className="px-6 py-4 text-right text-rose-600 font-mono">{formatCurrency(m.Despesas)}</td>
                <td className={`px-6 py-4 text-right font-mono font-bold ${m.Saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(m.Saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
