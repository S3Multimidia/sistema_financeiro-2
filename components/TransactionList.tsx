
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { Trash2, TrendingUp, TrendingDown, Filter, Search, Calendar, Settings, Clock, Move, Pencil, CheckCircle2, Circle, ChevronRight, ListFilter } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onMove: (id: string, newDay: number) => void;
  onToggleComplete?: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: 'ALL' | 'income' | 'expense' | 'appointment';
  onFilterTypeChange?: (type: 'ALL' | 'income' | 'expense' | 'appointment') => void;
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
  onManageCategories,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  // filterType moved to props
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

  // Scroll to current day on mount
  useEffect(() => {
    const today = new Date().getDate();
    const element = document.getElementById(`day-${today}`);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500); // Delay to ensure render
    }
  }, [groupedTransactions]);

  const days = Object.keys(groupedTransactions).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative">
      {/* Header with quick stats or simplified view if needed */}
      <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
            {transactions.length} registros
          </div>
        </div>
      </div>

      <div ref={listContainerRef} className="overflow-y-auto flex-1 p-6 min-h-[400px] max-h-[800px] scroll-smooth custom-scrollbar bg-slate-50/30">
        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <Search size={48} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nada encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus filtros</p>
            <button
              onClick={() => { onFilterTypeChange?.('ALL'); onSearchChange(''); onSelectedDayChange(''); }}
              className="mt-6 text-xs font-bold text-white bg-primary-500 px-6 py-2 rounded-full shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all"
            >
              Limpar Filtros
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
              <div key={day} id={`day-${day}`} className="mb-8 last:mb-0">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 py-3 border-b border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md shadow-slate-900/10">DIA {day}</span>
                    <div className="h-px w-8 bg-slate-300 hidden sm:block"></div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${dayTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    Dia: {formatCurrency(dayTotal)}
                  </span>
                </div>

                <div className="space-y-3">
                  {dayTrans.map(t => (
                    <div key={t.id} className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:shadow-md 
                        ${t.type === 'appointment'
                        ? (t.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-indigo-100 shadow-sm shadow-indigo-500/5')
                        : (t.type === 'income' && t.completed
                          ? 'bg-gradient-to-r from-white to-emerald-50/30 border-emerald-100/50 hover:border-emerald-200'
                          : 'bg-white border-slate-100 hover:border-slate-200')
                      }
                    `}>
                      <div className="flex items-center gap-4 overflow-hidden flex-1">
                        <div className="shrink-0">
                          <button
                            onClick={() => onToggleComplete?.(t.id)}
                            className={`transition-all duration-300 hover:scale-110 ${t.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
                            title={t.completed ? "Marcar como não pago" : "Marcar como pago"}
                          >
                            {t.completed ? <CheckCircle2 size={24} className="fill-emerald-100" /> : <Circle size={24} strokeWidth={1.5} />}
                          </button>
                        </div>

                        {/* Icon Box */}
                        <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${t.type === 'appointment' ? 'bg-indigo-50 text-indigo-500' :
                          t.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                          }`}>
                          {t.type === 'appointment' ? <Clock size={20} /> : t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-bold text-base truncate leading-tight ${t.type === 'appointment' ? (t.completed ? 'text-slate-400 line-through' : 'text-indigo-900') : 'text-slate-800'}`}>
                              {t.description}
                            </p>
                            {t.type === 'appointment' && !t.completed && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border ${t.type === 'appointment' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {t.category}
                            </span>
                            {t.subCategory && (
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <ChevronRight size={10} />
                                {t.subCategory}
                              </span>
                            )}

                            {t.client_name && (
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                                {t.client_name}
                              </span>
                            )}

                            {/* Status Badge */}
                            {t.perfex_status && (
                              <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border ${t.perfex_status === 'Atrasada' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                t.perfex_status === 'Em Aberto' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  (t.perfex_status === 'Paga' || t.perfex_status === 'Pago') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {t.perfex_status}
                              </span>
                            )}

                            {t.external_url && (
                              <a
                                href={t.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                title="Link Externo"
                              >
                                <Move size={12} className="-rotate-45" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 ml-4">
                        {t.type !== 'appointment' ? (
                          <div className="flex flex-col items-end">
                            <span className={`font-bold text-lg whitespace-nowrap tabular-nums tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                            {t.originalAmount && t.originalAmount !== t.amount && (
                              <span className="text-[10px] text-slate-400 font-medium line-through decoration-slate-300">
                                Orig: {formatCurrency(t.originalAmount)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                            Agenda
                          </span>
                        )}

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 gap-1 translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"><Pencil size={16} /></button>
                          {movingId === t.id ? (
                            <div className="flex items-center gap-1 bg-white shadow-lg p-1 rounded-lg absolute right-0 z-20 border border-slate-100">
                              <input
                                type="number"
                                className="w-12 text-xs p-1 border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-400 outline-none"
                                value={newDayVal}
                                autoFocus
                                onChange={(e) => setNewDayVal(e.target.value)}
                              />
                              <button onClick={() => { onMove(t.id, parseInt(newDayVal)); setMovingId(null); }} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><CheckCircle2 size={16} /></button>
                              <button onClick={() => setMovingId(null)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 size={16} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setMovingId(t.id); setNewDayVal(t.day.toString()); }} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Mudar Dia"><Move size={16} /></button>
                          )}
                          <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
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
    </div >
  );
};
