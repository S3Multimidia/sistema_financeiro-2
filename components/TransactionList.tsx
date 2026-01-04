
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { Trash2, TrendingUp, TrendingDown, Filter, Search, Calendar, Settings, Clock, Move, Pencil, CheckCircle2, Circle, ChevronRight, ListFilter } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onMove: (id: string, newDay: number) => void;
  onToggleComplete?: (id: string) => void;
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
  categoriesMap: Record<string, string[]>;
  onManageCategories: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onDelete, 
  onEdit,
  onMove,
  onToggleComplete,
  selectedDay, 
  onSelectedDayChange,
  categoriesMap,
  onManageCategories
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'income' | 'expense' | 'appointment'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const [newDayVal, setNewDayVal] = useState<string>('');
  const listContainerRef = useRef<HTMLDivElement>(null);

  const groupedTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Filtro por Tipo (Novo)
    if (filterType !== 'ALL') filtered = filtered.filter(t => t.type === filterType);
    
    if (filterCategory !== 'ALL') filtered = filtered.filter(t => t.category === filterCategory);
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term) ||
        (t.subCategory && t.subCategory.toLowerCase().includes(term))
      );
    }
    
    if (selectedDay) {
      const day = parseInt(selectedDay);
      if (!isNaN(day)) filtered = filtered.filter(t => t.day === day);
    }

    const sorted = [...filtered].sort((a, b) => a.day - b.day);
    const groups: { [key: number]: Transaction[] } = {};
    sorted.forEach(t => {
      if (!groups[t.day]) groups[t.day] = [];
      groups[t.day].push(t);
    });
    return groups;
  }, [transactions, filterType, filterCategory, searchTerm, selectedDay]);

  const days = Object.keys(groupedTransactions).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Lançamentos e Agenda</h2>
            <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">
              {transactions.length} registros
            </div>
          </div>
          
          {/* Botões de Filtro de Tipo */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-500'}`}
            >
              <TrendingUp size={12} /> Receitas
            </button>
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-rose-500'}`}
            >
              <TrendingDown size={12} /> Despesas
            </button>
            <button 
              onClick={() => setFilterType('appointment')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${filterType === 'appointment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              <Clock size={12} /> Agenda
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, categoria ou sub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            />
          </div>

          <div className="relative min-w-[140px]">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedDay}
              onChange={(e) => onSelectedDayChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            >
              <option value="">Todos Dias</option>
              {Array.from({length: 31}, (_, i) => i+1).map(d => <option key={d} value={d}>Dia {d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div ref={listContainerRef} className="overflow-y-auto flex-1 p-4 min-h-[300px] max-h-[700px] scroll-smooth custom-scrollbar">
        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/30 rounded-xl border-2 border-dashed border-slate-100">
            <Search size={40} className="mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Nenhum registro encontrado com estes filtros.</p>
            <button 
              onClick={() => { setFilterType('ALL'); setSearchTerm(''); onSelectedDayChange(''); }}
              className="mt-4 text-[10px] font-black text-indigo-600 uppercase hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          days.map(day => {
            const dayTrans = groupedTransactions[day];
            const dayTotal = dayTrans.reduce((acc, curr) => {
              if (curr.type === 'income') return acc + curr.amount;
              if (curr.type === 'expense') return acc - curr.amount;
              return acc;
            }, 0);

            return (
              <div key={day} className="mb-8 last:mb-0">
                <div className="flex items-center justify-between mb-3 sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">DIA {day}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded border shadow-sm ${dayTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    FLUXO: {formatCurrency(dayTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayTrans.map(t => (
                    <div key={t.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all bg-white ${t.type === 'appointment' ? (t.completed ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-indigo-100 bg-indigo-50/30 shadow-sm shadow-indigo-500/5') : 'border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-0.5'}`}>
                      <div className="flex items-start gap-3 overflow-hidden">
                        {t.type === 'appointment' ? (
                          <button 
                            onClick={() => onToggleComplete?.(t.id)}
                            className={`mt-1 transition-colors shrink-0 ${t.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                          >
                            {t.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        ) : (
                          <div className={`mt-1 p-2 rounded-xl shrink-0 shadow-sm ${
                            t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                        )}
                        
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate leading-tight ${t.type === 'appointment' ? (t.completed ? 'text-slate-400 line-through' : 'text-indigo-900 italic font-black') : 'text-slate-800'}`}>
                            {t.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${t.type === 'appointment' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              {t.category}
                            </span>
                            {t.subCategory && (
                              <>
                                <ChevronRight size={10} className="text-slate-300" />
                                <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                  {t.subCategory}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {t.type !== 'appointment' ? (
                          <span className={`font-black text-sm whitespace-nowrap tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {t.completed ? 'Concluído' : 'Agenda'}
                          </span>
                        )}
                        
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 rounded-lg p-1 border border-slate-100">
                           <button onClick={() => onEdit(t)} className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors" title="Editar"><Pencil size={14} /></button>
                           {movingId === t.id ? (
                             <div className="flex items-center gap-1 mx-1">
                               <input 
                                 type="number" 
                                 className="w-10 text-[10px] p-1 border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-400 outline-none" 
                                 value={newDayVal}
                                 autoFocus
                                 onChange={(e) => setNewDayVal(e.target.value)}
                               />
                               <button onClick={() => { onMove(t.id, parseInt(newDayVal)); setMovingId(null); }} className="text-emerald-500 hover:scale-110 transition-transform"><Settings size={14} /></button>
                             </div>
                           ) : (
                             <button onClick={() => { setMovingId(t.id); setNewDayVal(t.day.toString()); }} className="text-slate-400 hover:text-amber-500 p-1.5 transition-colors" title="Mudar Dia"><Move size={14} /></button>
                           )}
                           <button onClick={() => onDelete(t.id)} className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors" title="Excluir"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
