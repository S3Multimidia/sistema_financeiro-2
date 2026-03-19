import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { ChatAgent } from './ChatAgent';
import { Transaction } from '../types';

interface IntellicenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentMonth: number;
  currentYear: number;
  currentBalance: number;
  summary: any;
  categoriesMap: Record<string, string[]>;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  setCategoriesMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export const IntellicenterModal: React.FC<IntellicenterModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currentMonth,
  currentYear,
  currentBalance,
  summary,
  categoriesMap,
  onAddTransaction,
  setCategoriesMap
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      {/* Backdrop with extreme blur and dark tint */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-fade-in duration-500"
        onClick={onClose}
      ></div>

      {/* Center Modal Container */}
      <div className="relative z-10 w-full max-w-4xl h-[85vh] bg-slate-950 rounded-[3rem] shadow-[0_0_120px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-10 duration-500">
        {/* Premium Modal Header */}
        <div className="bg-slate-900/50 backdrop-blur-md px-10 py-7 flex justify-between items-center border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="relative">
                <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-40"></div>
              </div>
              Intellicenter <span className="text-emerald-500/50 font-light">v2.0</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest leading-none">Assistência Cognitiva & Execução Financeira</span>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300 border border-white/5"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Modal Content - Chat Area */}
        <div className="flex-1 overflow-hidden relative">
          <ChatAgent
            transactions={transactions}
            monthTransactions={transactions.filter(t => t.month === currentMonth && t.year === currentYear)}
            currentBalance={summary.currentBalance}
            summary={summary}
            categoriesMap={categoriesMap}
            onAddTransaction={onAddTransaction}
            setCategoriesMap={setCategoriesMap}
          />
        </div>
      </div>
    </div>
  );
};
