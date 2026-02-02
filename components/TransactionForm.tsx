
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PlusCircle, Calendar, Repeat, CreditCard, ChevronRight, DollarSign } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>, options: { installments: number, isFixed: boolean }) => void;
  categoriesMap: Record<string, string[]>;
  currentMonth: number;
  currentYear: number;
  isDarkMode?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, categoriesMap, currentMonth, currentYear, isDarkMode = false }) => {
  const categories = Object.keys(categoriesMap);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [subCategory, setSubCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'appointment'>('expense');
  const [day, setDay] = useState<number>(new Date().getDate());

  const [isFixed, setIsFixed] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('1');

  const subCategoriesList = useMemo(() => {
    return categoriesMap[category] || [];
  }, [category, categoriesMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    if (type !== 'appointment' && !amount) return;

    onAdd({
      day,
      month: currentMonth,
      year: currentYear,
      category: type === 'appointment' ? 'AGENDA' : category,
      subCategory: type === 'appointment' ? undefined : subCategory.trim(),
      description,
      amount: type === 'appointment' ? 0 : parseFloat(amount.replace(',', '.')),
      type
    }, {
      installments: isInstallment ? parseInt(installmentsCount) : 1,
      isFixed
    });

    setDescription('');
    setAmount('');
    setSubCategory('');
    setIsFixed(false);
    setIsInstallment(false);
    setInstallmentsCount('1');
  };

  return (
    <div className={`${isDarkMode ? 'bg-transparent text-white border-0' : 'bg-white p-5 rounded-xl shadow-sm border border-slate-200'} h-full flex flex-col`}>
      <div className={`flex items-center gap-2 mb-5 ${isDarkMode ? 'border-b border-white/10 pb-3' : 'border-b border-slate-100 pb-3'}`}>
        {!isDarkMode && <PlusCircle size={20} className="text-slate-700" />}
        <h3 className={`font-bold ${isDarkMode ? 'text-white/50 text-[10px] uppercase tracking-widest hidden' : 'text-slate-800'}`}>Lançamento Inteligente</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className={`grid grid-cols-3 gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
          <button type="button" onClick={() => { setType('income'); setIsInstallment(false); }} className={`py-2 text-[10px] font-bold rounded-md transition-all ${type === 'income' ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white text-emerald-600 shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-slate-500')}`}>RECEITA</button>
          <button type="button" onClick={() => { setType('expense'); }} className={`py-2 text-[10px] font-bold rounded-md transition-all ${type === 'expense' ? (isDarkMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-white text-rose-600 shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-slate-500')}`}>DESPESA</button>
          <button type="button" onClick={() => { setType('appointment'); setIsInstallment(false); }} className={`py-2 text-[10px] font-bold rounded-md transition-all ${type === 'appointment' ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-white text-indigo-600 shadow-sm') : (isDarkMode ? 'text-white/40 hover:text-white' : 'text-slate-500')}`}>AGENDA</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={`block text-[10px] font-bold mb-1 uppercase ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Dia</label>
            <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(parseInt(e.target.value))} className={`w-full border rounded-lg p-2.5 text-sm outline-none ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white focus:border-indigo-500/50' : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-800'}`} />
          </div>
          <div className="col-span-2">
            <label className={`block text-[10px] font-bold mb-1 uppercase ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>{type === 'appointment' ? 'Prioridade' : 'Valor'}</label>
            <div className="relative">
              {type !== 'appointment' && (
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>R$</span>
              )}
              <input
                type={type === 'appointment' ? 'text' : 'number'}
                step="0.01"
                disabled={type === 'appointment'}
                placeholder={type === 'appointment' ? '-' : '0,00'}
                value={type === 'appointment' ? '' : amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full border rounded-lg p-2.5 text-sm outline-none ${type !== 'appointment' ? 'pl-9' : ''} ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white placeholder:text-white/10 focus:border-indigo-500/50' : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-800'}`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Descrição</label>
          <input type="text" placeholder="Ex: Compra supermercado..." value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm outline-none ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white placeholder:text-white/10 focus:border-indigo-500/50' : 'border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-800'}`} required />
        </div>

        {type !== 'appointment' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Categoria</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory('');
                }}
                className={`w-full border rounded-lg p-2.5 text-xs outline-none truncate ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className={isDarkMode ? 'text-slate-800' : ''}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Subcategoria (Opc)</label>
              <input
                type="text"
                list="sub-options"
                placeholder="Esc. ou Sel."
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className={`w-full border rounded-lg p-2.5 text-xs outline-none ${isDarkMode ? 'bg-slate-900/50 border-white/10 text-white placeholder:text-white/10' : 'border-slate-200 bg-white text-slate-900'}`}
              />
              <datalist id="sub-options">
                {subCategoriesList.map(sub => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        <div className={`space-y-3 pt-2 mt-auto ${isDarkMode ? 'border-t border-white/10' : 'border-t border-slate-50'}`}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={isFixed} onChange={e => { setIsFixed(e.target.checked); if (e.target.checked) setIsInstallment(false); }} className="w-4 h-4 rounded text-indigo-600" />
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-white/50 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                <Repeat size={14} className={isFixed ? 'text-indigo-600' : ''} />
                <span className="text-[11px] font-bold uppercase">Mensal Fixo</span>
              </div>
            </label>

            {type !== 'appointment' && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if (e.target.checked) setIsFixed(false); }} className="w-4 h-4 rounded text-indigo-600" />
                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-white/50 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  <CreditCard size={14} className={isInstallment ? 'text-indigo-600' : ''} />
                  <span className="text-[11px] font-bold uppercase">Parcelar</span>
                </div>
              </label>
            )}
          </div>

          <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${type === 'appointment' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
            <PlusCircle size={18} />
            Lançar
          </button>
        </div>
      </form>
    </div>
  );
};
