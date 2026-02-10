
import React, { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { Transaction } from '../types';
import {
  TrendingUp, TrendingDown, PiggyBank, Wallet,
  ArrowRight, ShieldCheck, PieChart as PieIcon,
  Activity, Info, Briefcase, Scale
} from 'lucide-react';

interface AdvancedDashboardProps {
  transactions: Transaction[]; // Transações do mês atual
  allTransactions: Transaction[]; // Todas as transações para cálculo do saldo poupado
  currentMonth: number;
  year: number;
  previousBalance: number;
}

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-white">{p.name}:</span>
            <span className="text-xs font-black text-indigo-400">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ transactions, allTransactions, currentMonth, year, previousBalance }) => {
  const stats = useMemo(() => {
    // 1. Cálculos de KPIs
    const incomeTransactions = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const income = incomeTransactions + previousBalance;
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Valor Poupado no Mês (Transações na categoria POUPANÇA)
    const monthlySavings = transactions
      .filter(t => t.category === 'POUPANÇA')
      .reduce((acc, t) => acc + t.amount, 0);

    // Saldo Poupado Acumulado (Histórico de POUPANÇA)
    const totalSavingsBalance = allTransactions
      .filter(t => t.category === 'POUPANÇA')
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Gráfico de Entradas por Categoria/Sub (Onde ganho mais?)
    const incomeMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      const key = t.subCategory ? `${t.category} > ${t.subCategory}` : t.category;
      incomeMap[key] = (incomeMap[key] || 0) + t.amount;
    });
    const incomeData = Object.entries(incomeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Gráfico de Saídas por Categoria/Sub (Onde gasto mais?)
    const expenseMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const key = t.subCategory ? `${t.category} > ${t.subCategory}` : t.category;
      expenseMap[key] = (expenseMap[key] || 0) + t.amount;
    });
    const expenseData = Object.entries(expenseMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Comparativo de Fluxo (Entradas vs Saídas)
    const flowData = [
      { name: 'Geral', Entradas: income, Saídas: expense }
    ];

    // 5. Top Alocações (Simplificado para o card lateral)
    const topCategories = Object.entries(expenseMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { income, expense, monthlySavings, totalSavingsBalance, incomeData, expenseData, flowData, topCategories };
  }, [transactions, allTransactions]);

  return (
    <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-10 duration-700">
      {/* Header do Dashboard Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Activity className="text-indigo-500" size={32} />
            Intelligence Center <span className="text-indigo-500/50 font-light">2026</span>
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
            Análise Avançada de Performance Financeira
          </p>
        </div>
      </div>

      {/* Grid de Métricas Power BI Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Entradas Consolidadas', value: stats.income, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
          { label: 'Saídas Consolidadas', value: stats.expense, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
          { label: 'Valor Poupado (Mês)', value: stats.monthlySavings, icon: PiggyBank, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
          { label: 'Saldo Poupado Total', value: stats.totalSavingsBalance, icon: Wallet, color: 'text-cyan-600', bg: 'bg-cyan-100', border: 'border-cyan-200' },
        ].map((m, i) => (
          <div key={i} className={`p-6 rounded-3xl border ${m.border} ${m.bg} shadow-sm group hover:scale-[1.02] transition-all`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/60 ${m.color} shadow-sm`}>
                <m.icon size={24} strokeWidth={2.5} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{m.label}</p>
            <h3 className={`text-2xl font-black text-slate-900`}>
              {formatCurrency(m.value)}
            </h3>
          </div>
        ))}
      </div>

      {/* Novo Gráfico: Entradas X Saídas (Comparativo Geral) */}
      <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
              <Scale className="text-indigo-400" size={22} />
              Balanço Mensal: Entradas vs Saídas
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Comparativo de volume total do período</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-500"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Saídas</span>
            </div>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.flowData} barGap={40}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="Entradas" fill="#10b981" radius={[12, 12, 12, 12]} barSize={120} />
              <Bar dataKey="Saídas" fill="#ef4444" radius={[12, 12, 12, 12]} barSize={120} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seção de Gráficos de Detalhamento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Rentabilidade por Origem (RECEITAS) */}
        <div className="lg:col-span-6 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
                <Briefcase className="text-emerald-500" size={20} />
                Rentabilidade por Origem
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Análise de Categorias e Subcategorias de Entrada</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.incomeData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="value" name="Valor" radius={[0, 8, 8, 0]} barSize={24}>
                  {stats.incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.8 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análise de Custos por Categoria (DESPESAS) */}
        <div className="lg:col-span-6 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
                <TrendingDown className="text-rose-500" size={20} />
                Dissecação de Custos
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Peso por Categoria e Subcategoria de Saída</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.expenseData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="value" name="Valor" radius={[0, 8, 8, 0]} barSize={24}>
                  {stats.expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#ef4444" fillOpacity={0.8 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Top Alocações e Insight de Poupança */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black text-lg uppercase flex items-center gap-2">
              <PieIcon className="text-indigo-400" size={20} />
              Concentração de Alocações
            </h3>
          </div>
          <div className="space-y-6">
            {stats.topCategories.map((cat, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors">{cat.name}</span>
                  <span className="text-[11px] font-mono font-bold text-white/80">{formatCurrency(cat.value)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(cat.value / stats.expense) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center">
          <div className="bg-indigo-500/20 p-6 rounded-full text-indigo-400 mb-6 border border-indigo-500/30">
            <PiggyBank size={48} />
          </div>
          <h4 className="text-white font-black text-xl uppercase mb-2">Meta de Poupança</h4>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Eficiência de Reserva</p>
          <div className="text-3xl font-black text-emerald-400 mb-2">
            {((stats.monthlySavings / stats.income) * 100 || 0).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase">
            da sua receita este mês foi destinada para <span className="text-indigo-400">futuro e segurança</span>.
          </p>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-2xl border border-white/5 w-full">
            <div className="flex items-center gap-3 text-left">
              <Info size={16} className="text-indigo-400 shrink-0" />
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">
                Dica: Tente manter sua taxa de poupança acima de 20% para acelerar sua independência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
